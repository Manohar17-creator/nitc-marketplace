import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { token } = await request.json()

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: { isVerified: true } }
    )

    return NextResponse.json({ message: 'Email verified successfully' })

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}