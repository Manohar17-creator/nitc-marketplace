import admin from 'firebase-admin'
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
    console.log('🔥 Firebase Admin Initialized')
  } catch (error) {
    console.error('❌ Firebase Admin Init Error:', error)
  }
}



// Create Single Notification (DB + Optional Push)
export async function createNotification({ userId, title, message, type = 'info', link = null }) {
  
  const db = await getDb()
  // Save to Database
  await db.collection('notifications').insertOne({
    userId: new ObjectId(userId),
    title,
    message,
    type, 
    link,
    read: false,
    createdAt: new Date()
  })
}

// lib/notifications.js

export async function sendTargetedNotification({ userIds, title, message, type = 'info', link = null }) {
  console.log(`🎯 === TARGETED STARTING (${userIds.length} users) ===`);
  
  const db = await getDb();
  const objectIds = userIds.map(id => new ObjectId(id));

  // 1. Save to Database (Working correctly)
  const notificationDocs = objectIds.map(id => ({
    userId: id,
    title,
    message,
    type,
    link: link || '/notifications',
    read: false,
    createdAt: new Date()
  }));

  try {
    await db.collection('notifications').insertMany(notificationDocs);
    console.log(`✅ Saved ${notificationDocs.length} records to DB`);
  } catch (err) {
    console.error('❌ DB targeted insert failed:', err);
  }

  // 2. Fetch Tokens from the 'fcmTokens' ARRAY
  try {
    const usersWithTokens = await db.collection('users')
      .find({ _id: { $in: objectIds } })
      .project({ fcmTokens: 1 })
      .toArray();

    // Flatten all arrays into one list of tokens
    const tokens = usersWithTokens.flatMap(u => u.fcmTokens || []);

    if (tokens.length > 0) {
      const multicastMessage = {
        tokens: tokens, // Firebase handles up to 500 tokens here
        notification: { title, body: message },
        data: {
          type: type || 'info',
          url: link || '/notifications',
        }
      };

      const response = await admin.messaging().sendEachForMulticast(multicastMessage);
      console.log(`✅ Firebase: ${response.successCount} sent, ${response.failureCount} failed`);
    } else {
      console.log('⚠️ No FCM tokens found in fcmTokens arrays for these users.');
    }
  } catch (err) {
    console.error('❌ Firebase targeted push failed:', err);
  }
}

// Broadcast Notification (Topic Push + Bulk DB Insert)
export async function broadcastNotification({ title, message, type = 'info', link = null }) {
  console.log('🚀 === BROADCAST STARTING ===')
  console.log('📝 Title:', title)
  console.log('📝 Message:', message)

  
  const db = await getDb()
  const topic = 'all_users'

  // === STEP 1: Send Push Notification via Firebase ===
  // 🆕 Updated Structure for .send() method
  const firebaseMessage = {
    topic: topic, // 👈 Topic goes INSIDE the object now
    notification: {
      title: title,
      body: message,
    },
    data: {
      type: type || 'info',
      url: link || '/announcements',
      click_action: link || '/announcements'
    }
  }

  console.log('📦 Firebase Message Payload:', JSON.stringify(firebaseMessage, null, 2))

  try {
    console.log('📤 Sending to Firebase topic:', topic)
    
    // ✅ FIXED: Use .send() instead of .sendToTopic()
    const response = await admin.messaging().send(firebaseMessage)
    
    // The response is now just a string (Message ID) on success
    console.log('✅ Firebase Success! Message ID:', response)

  } catch (firebaseError) {
    console.error('❌ Firebase Broadcast Failed:', firebaseError.code)
    console.error('Error message:', firebaseError.message)
    // Continue to save in DB even if Firebase fails
  }

  // === STEP 2: Save to Database (For notification bell icon) ===
  console.log('💾 Fetching users from database...')
  
  // Ensure we use the correct database name (verify strictly if it's 'nitc-marketplace')
  const users = await db.collection('users').find({}, { projection: { _id: 1 } }).toArray()
  
  console.log(`👥 Found ${users.length} users in database`)

  if (users.length === 0) {
    console.warn('⚠️ No users found in database!')
    return
  }

  const notifications = users.map(user => ({
    userId: user._id,
    title,
    message,
    type,
    link,
    read: false,
    createdAt: new Date()
  }))

  try {
    const dbResult = await db.collection('notifications').insertMany(notifications)
    console.log(`✅ Inserted ${dbResult.insertedCount} notifications into database`)
  } catch (dbError) {
    console.error('❌ Database insert failed:', dbError)
  }

  console.log('🏁 === BROADCAST COMPLETE ===')
}