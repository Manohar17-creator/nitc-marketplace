import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fcmToken } = await request.json()

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')
    const userId = new ObjectId(decoded.userId)

    // 1. CLEANUP: Remove this token from ANY other user
    // (Prevents one device receiving notifs for the wrong account if they switched users)
    await db.collection('users').updateMany(
      { fcmTokens: fcmToken, _id: { $ne: userId } },
      { $pull: { fcmTokens: fcmToken } } // 👈 Removes from array
    )

    // 2. SAVE: Add to the Current User's Array
    // $addToSet ensures we don't add the same token twice
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $addToSet: { fcmTokens: fcmToken }, // 👈 Supports multiple devices
        $set: { fcmTokenUpdatedAt: new Date() }
      }
    )

    console.log(`FCM token saved for user: ${decoded.userId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save FCM token error:', error)
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
  }
}