// app/api/auth/resend-verification/route.js
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { generateToken } from '@/lib/auth' // 👈 Don't forget this
import { sendVerificationEmail } from '@/lib/email' // 👈 Import the helper

export async function POST(request) {
  try {
    const { email } = await request.json()

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 1. Find User
    const user = await db.collection('users').findOne({ email })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // 2. Generate Link
    const verificationToken = generateToken(user._id.toString())
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`

    // 3. Send Email DIRECTLY (Faster & Safer)
    await sendVerificationEmail(user.email, verificationLink)

    return NextResponse.json({ message: 'Verification email sent!' })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}