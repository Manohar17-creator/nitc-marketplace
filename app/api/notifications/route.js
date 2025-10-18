import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch user's notifications
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Get user's notifications (last 50)
    const notifications = await db
      .collection('notifications')
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    // Count unread
    const unreadCount = await db
      .collection('notifications')
      .countDocuments({ 
        userId: new ObjectId(decoded.userId),
        read: false 
      })

    return NextResponse.json({ 
      notifications, 
      unreadCount 
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST - Create notification (internal use)
export async function POST(request) {
  try {
    const data = await request.json()
    const { userId, type, title, message, listingId, link, icon } = data

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const result = await db.collection('notifications').insertOne({
      userId: new ObjectId(userId),
      type,
      title,
      message,
      listingId: listingId ? new ObjectId(listingId) : null,
      link,
      icon,
      read: false,
      createdAt: new Date()
    })

    return NextResponse.json({
      message: 'Notification created',
      notificationId: result.insertedId
    })

  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}