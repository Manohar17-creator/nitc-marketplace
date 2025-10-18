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