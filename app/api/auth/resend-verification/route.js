import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  try {
    const { email } = await request.json()

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Find user
    const user = await db.collection('users').findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Send verification email
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        userId: user._id.toString()
      })
    })

    if (response.ok) {
      return NextResponse.json({ message: 'Verification email sent!' })
    } else {
      throw new Error('Failed to send email')
    }

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}