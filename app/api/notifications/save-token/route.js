import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

export async function POST(request) {
  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 2. ✅ FIXED: Read body only ONCE
    const rawText = await request.text()
    if (!rawText) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }

    let fcmToken;
    try {
      const body = JSON.parse(rawText) // Parse the variable, not the request
      fcmToken = body.fcmToken
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 20) {
      return NextResponse.json({ error: 'Invalid FCM token format' }, { status: 400 })
    }

    // 3. Database Operations
    const db = await getDb()    
    const userId = new ObjectId(decoded.userId)

    // 4. CLEANUP: Remove this token from any other user
    // Ensures notifications don't go to the wrong account on shared devices
    await db.collection('users').updateMany(
      { fcmTokens: fcmToken, _id: { $ne: userId } },
      { 
        $pull: { fcmTokens: fcmToken },
        $set: { fcmTokenUpdatedAt: new Date() }
      }
    )

    // 5. SAVE: Add to the current user's array
    const updateResult = await db.collection('users').updateOne(
      { _id: userId },
      { 
        $addToSet: { fcmTokens: fcmToken }, // Prevents duplicates in array
        $set: { fcmTokenUpdatedAt: new Date() }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`✅ FCM token saved for user: ${decoded.userId}`)
    return NextResponse.json({ success: true, message: 'Token saved' })

  } catch (error) {
    console.error('❌ Save FCM token error:', error)
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
  }
}

/**
 * 🗑️ DELETE method for Logout
 * Removes specific device token from the user
 */
export async function DELETE(request) {
  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. ✅ FIXED: Safe Body Reading
    // Read raw text first to prevent "Body is unusable" errors
    const rawText = await request.text()
    if (!rawText) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 })
    }

    let fcmToken;
    try {
      const body = JSON.parse(rawText)
      fcmToken = body.fcmToken
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 })
    }

    // 3. Database Operation
    const db = await getDb()
    
    // Use $pull to specifically remove ONLY this device's token
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $pull: { fcmTokens: fcmToken },
        $set: { lastLogout: new Date() } // Optional: track last logout activity
      }
    )

    console.log(`🗑️ FCM token removed for user: ${decoded.userId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Device unregistered from notifications' 
    })

  } catch (error) {
    console.error('❌ Delete FCM token error:', error)
    return NextResponse.json({ error: 'Failed to remove token' }, { status: 500 })
  }
}