import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

export async function POST(request) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // 2. Validate request body
    const body = await request.json()
    const { fcmToken } = body

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'Valid FCM token required' }, { status: 400 })
    }

    // 3. Validate token format (basic check)
    if (fcmToken.length < 20) {
      return NextResponse.json({ error: 'Invalid FCM token format' }, { status: 400 })
    }

    // 4. Database operations
    const client = await clientPromise
    const db = client.db('nitc-marketplace')
    
    let userId
    try {
      userId = new ObjectId(decoded.userId)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // 5. CLEANUP: Remove this token from any other user
    // Prevents one device receiving notifications for the wrong account if they switched users
    const cleanupResult = await db.collection('users').updateMany(
      { 
        fcmTokens: fcmToken, 
        _id: { $ne: userId } 
      },
      { 
        $pull: { fcmTokens: fcmToken },
        $set: { fcmTokenUpdatedAt: new Date() }
      }
    )

    if (cleanupResult.modifiedCount > 0) {
      console.log(`Removed FCM token from ${cleanupResult.modifiedCount} other user(s)`)
    }

    // 6. SAVE: Add to the current user's array
    // $addToSet ensures we don't add the same token twice (supports multiple devices)
    const updateResult = await db.collection('users').updateOne(
      { _id: userId },
      { 
        $addToSet: { fcmTokens: fcmToken },
        $set: { fcmTokenUpdatedAt: new Date() }
      },
      { upsert: false } // Don't create user if they don't exist
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`✅ FCM token saved for user: ${decoded.userId}`)

    return NextResponse.json({ 
      success: true,
      message: 'FCM token saved successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Save FCM token error:', error)
    
    // Provide more specific error messages in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        error: 'Failed to save token',
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
  }
}

// Optional: Add DELETE method to remove FCM token (for logout)
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const { fcmToken } = body

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')
    const userId = new ObjectId(decoded.userId)

    // Remove the FCM token from user's array
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $pull: { fcmTokens: fcmToken },
        $set: { fcmTokenUpdatedAt: new Date() }
      }
    )

    console.log(`🗑️ FCM token removed for user: ${decoded.userId}`)

    return NextResponse.json({ 
      success: true,
      message: 'FCM token removed successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Delete FCM token error:', error)
    return NextResponse.json({ error: 'Failed to remove token' }, { status: 500 })
  }
}