import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken, hashPassword } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json()

    // 1. Verify the Token
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired link. Please request a new one.' },
        { status: 400 }
      )
    }

    
    const db = await getDb();    const userId = new ObjectId(decoded.userId)

    // 2. Hash the New Password
    const hashedPassword = await hashPassword(newPassword)

    // 3. Update User Password in DB
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Password reset successful' })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}