import { NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Initialize Firebase (Same as your notifications lib)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  } catch (error) {
    console.error('Firebase Admin Init Error:', error)
  }
}

export async function POST(request) {
  try {
    const { token } = await request.json()

    if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 })

    // ✅ THE MAGIC FIX: Subscribe this specific token to 'all_users'
    await admin.messaging().subscribeToTopic(token, 'all_users')
    
    console.log('✅ Subscribed user to "all_users" topic')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}