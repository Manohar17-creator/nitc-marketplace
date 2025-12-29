import admin from 'firebase-admin'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// ------------------------------------------------------------------
// 1. Initialize Firebase Admin (Singleton Pattern)
// ------------------------------------------------------------------
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // vital fix for Vercel/Production env variables handling newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
      }),
    })
    console.log('🔥 Firebase Admin Initialized')
  } catch (error) {
    console.error('❌ Firebase Admin Init Error:', error)
  }
}

// ------------------------------------------------------------------
// 2. Create Single Notification (DB + Optional Push)
// ------------------------------------------------------------------
export async function createNotification({ userId, title, message, type = 'info', link = null }) {
  const client = await clientPromise
  const db = client.db('nitc-marketplace')

  // A. Save to Database (Reliable history)
  await db.collection('notifications').insertOne({
    userId: new ObjectId(userId),
    title,
    message,
    type, 
    link,
    read: false,
    createdAt: new Date()
  })

  // B. Send Push (Only if user has an FCM token saved)
  // Note: You need to implement logic to save user FCM tokens in your 'users' collection 
  // for this specific part to work. For now, we just save to DB.
}

// ------------------------------------------------------------------
// 3. Broadcast Notification (Topic Push + Bulk DB Insert)
// ------------------------------------------------------------------
export async function broadcastNotification({ title, message, type = 'info', link = null }) {
  const client = await clientPromise
  const db = client.db('nitc-marketplace')

  const topic = 'all_users'

  // 🔧 FIXED: Use sendToTopic instead of send
  const payload = {
    notification: {
      title: title,
      body: message,
    },
    data: {
      type: type || 'info',
      url: link || '/announcements',
    }
  }

  try {
    // ✅ Changed from send() to sendToTopic()
    const response = await admin.messaging().sendToTopic(topic, payload)
    console.log('✅ Firebase Broadcast Sent:', response)
  } catch (error) {
    console.error('⚠️ Firebase Broadcast Failed:', error.message)
  }

  // Save to Database
  const users = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray()
  
  if (users.length === 0) return

  const notifications = users.map(user => ({
    userId: user._id,
    title,
    message,
    type,
    link,
    read: false,
    createdAt: new Date()
  }))

  await db.collection('notifications').insertMany(notifications)
  console.log(`✅ Saved ${notifications.length} notifications to DB`)
}