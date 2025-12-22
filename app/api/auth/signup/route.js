import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { hashPassword, isNITCEmail } from '@/lib/auth' // Removed generateToken since we don't use it here anymore

export async function POST(request) {
  try {
    const { name, email, phone, password } = await request.json()

    // 1. Validate NITC email
    if (!isNITCEmail(email)) {
      return NextResponse.json(
        { error: 'Please use your NITC email (@nitc.ac.in)' },
        { status: 400 }
      )
    }

    // 2. Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 3. Check if user exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // 4. Hash password & Create User
    const hashedPassword = await hashPassword(password)

    const result = await db.collection('users').insertOne({
      name,
      email,
      phone,
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date(),
      listings: []
    })

    // 5. Send Verification Email (Internal API Call)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userId: result.insertedId.toString()
        })
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // We continue anyway, user can click "Resend" later if needed
    }

    // 6. Return Success (BUT NO TOKEN)
    // We do NOT log them in yet. They must verify first.
    return NextResponse.json({
      message: 'Account created! Please check your email to verify.',
      user: { 
        id: result.insertedId,
        name, 
        email, 
        phone,
        isVerified: false 
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Something went wrong', details: error.message },
      { status: 500 }
    )
  }
}