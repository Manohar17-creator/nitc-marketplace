import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { hashPassword, generateToken, isNITCEmail } from '@/lib/auth'

export async function POST(request) {
  try {
    const { name, email, phone, password } = await request.json()

    // Validate NITC email
    if (!isNITCEmail(email)) {
      return NextResponse.json(
        { error: 'Please use your NITC email (@nitc.ac.in)' },
        { status: 400 }
      )
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const result = await db.collection('users').insertOne({
      name,
      email,
      phone,
      password: hashedPassword,
      isVerified: true, // Auto-verify for now
      createdAt: new Date(),
      listings: []
    })

    // After inserting user, send verification email
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
    // Continue anyway - user can still use the app
    }
    // Generate token
    const token = generateToken(result.insertedId.toString())

    return NextResponse.json({
      message: 'Account created successfully!',
      token,
      user: { 
        id: result.insertedId,
        name, 
        email, 
        phone 
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