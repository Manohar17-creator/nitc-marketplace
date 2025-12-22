import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { broadcastNotification } from '@/lib/notifications'

export async function POST(request) {
  try {
    // 1. Auth Check
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const user = await verifyToken(token)

    // Check if user is admin (You should add specific admin logic here)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, message, type } = await request.json()
    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 2. Send Push Notification (Firebase)
    await broadcastNotification({ title, message, type })

    // 3. ✅ DATABASE FIX: Save to every user's notification list
    // This ensures it shows up in the Bell icon even if they missed the push
    const allUsers = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray()
    
    if (allUsers.length > 0) {
      const notifications = allUsers.map(u => ({
        userId: u._id,
        type: 'broadcast',
        title: title || '📢 Announcement',
        message: message,
        link: '/announcements', // Or wherever you want them to go
        read: false,
        createdAt: new Date()
      }))
      
      await db.collection('notifications').insertMany(notifications)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Broadcast error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}