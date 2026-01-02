// app/api/auth/google/callback/route.js
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { generateToken } from '@/lib/auth'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // 1. Safe Redirect URI (From Snippet 1)
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      console.error('Token exchange failed:', tokens)
      return NextResponse.redirect(new URL('/login?error=token_failed', request.url))
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const googleUser = await userInfoResponse.json()

    // Enforce NITC domain
    if (!googleUser.email.endsWith('@nitc.ac.in')) {
      return NextResponse.redirect(new URL('/login?error=invalid_domain', request.url))
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    let user = await db.collection('users').findOne({ email: googleUser.email })

    if (!user) {
      // Create new user
      const result = await db.collection('users').insertOne({
        email: googleUser.email,
        name: googleUser.name,
        phone: '', 
        isVerified: true,
        googleId: googleUser.id,
        picture: googleUser.picture,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      user = await db.collection('users').findOne({ _id: result.insertedId })
    } else {
      // Update existing user
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            googleId: googleUser.id,
            picture: googleUser.picture,
            isVerified: true,
            updatedAt: new Date()
          }
        }
      )
    }

    const token = await generateToken(user._id.toString()) // ✅ NEW (Async)
    
    // 2. Richer User Data (From Snippet 2)
    const userObj = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      isVerified: user.isVerified,
      picture: user.picture || '',
    }

    // 3. Smart Redirect Logic (From Snippet 2)
    // If no phone number, force them to complete profile
    const redirectUrl = !user.phone 
      ? new URL('/complete-profile', request.url)
      : new URL('/', request.url)
    
    const response = NextResponse.redirect(redirectUrl)
    
    response.cookies.set('auth_token', token, {
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    
    response.cookies.set('user_data', JSON.stringify(userObj), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}