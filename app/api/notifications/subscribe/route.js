import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Initialize Firebase Admin (Singleton Pattern)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
    console.log('🔥 Firebase Admin Initialized for Subscribe Route')
  } catch (error) {
    console.error('❌ Firebase Admin Init Error:', error)
  }
}

export async function POST(request) {
  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization')
    const authToken = authHeader?.split(' ')[1]
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 })
    }

    const decoded = verifyToken(authToken)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // 2. Get FCM Token from Request Body
    const { fcmToken } = await request.json()

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token missing' }, { status: 400 })
    }

    console.log(`🔔 Subscribing user ${decoded.userId} to all_users topic...`)

    // 3. Subscribe to Firebase Cloud Messaging Topic
    const response = await admin.messaging().subscribeToTopic(fcmToken, 'all_users')
    
    console.log('✅ Firebase Topic Subscription Response:', response)

    // 4. Optional: Update user's subscription status in database
    try {
      
      const db = await getDb()      
      await db.collection('users').updateOne(
        { _id: new ObjectId(decoded.userId) },
        { 
          $set: { 
            subscribedToTopics: ['all_users'],
            lastTopicSubscription: new Date()
          } 
        }
      )
      console.log('✅ Updated user subscription status in DB')
    } catch (dbError) {
      console.warn('⚠️ Failed to update DB (non-critical):', dbError.message)
      // Don't fail the request if DB update fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully subscribed to broadcast notifications',
      successCount: response.successCount || 1
    })

  } catch (error) {
    console.error('❌ Subscription Error:', error)
    
    // Handle specific Firebase errors
    if (error.code === 'messaging/invalid-registration-token') {
      return NextResponse.json({ 
        error: 'Invalid FCM token. Please refresh notifications.' 
      }, { status: 400 })
    }
    
    if (error.code === 'messaging/registration-token-not-registered') {
      return NextResponse.json({ 
        error: 'FCM token not registered. Please enable notifications again.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to subscribe to notifications',
      details: error.message 
    }, { status: 500 })
  }
}