import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { fcmToken } = await request.json()
    const db = await getDb()

    // 🚀 REMOVE ONLY THIS TOKEN
    await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $pull: { fcmTokens: fcmToken } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}