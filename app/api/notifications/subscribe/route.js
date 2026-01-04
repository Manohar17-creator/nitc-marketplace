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
    const decoded = verifyToken(authToken)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Safely Get FCM Token from Request Body
    const text = await request.text(); 
    if (!text) {
      return NextResponse.json({ error: 'FCM token missing' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text); 
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
    }

    const { fcmToken } = body;
    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token missing' }, { status: 400 })
    }

    // 3. Database Update (Primary Source of Truth)
    // We do this first because it's fast and local.
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

    // 4. 🚀 FIRE-AND-FORGET: Background Subscription
    // We do NOT 'await' this. This prevents the 15s timeout error.
    console.log(`🔔 Initiating background subscription for ${decoded.userId}...`)
    
    admin.messaging().subscribeToTopic(fcmToken, 'all_users')
      .then((response) => {
        console.log('✅ Background Subscription Success:', response)
      })
      .catch((err) => {
        // Even if this fails, the user is still "registered" in our DB
        console.error('❌ Background Subscription Error:', err.message)
      })

    // 5. Respond immediately to the Frontend
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription process started' 
    })

  } catch (error) {
    console.error('❌ Critical Route Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}