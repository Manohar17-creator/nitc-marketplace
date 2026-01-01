import admin from 'firebase-admin'
import clientPromise from '@/lib/mongodb'

// Initialize Firebase Admin SDK (server-side only)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

/**
 * Send notification to multiple users
 * @param {Array<string>} tokens - Array of FCM tokens (max 500 per batch)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} url - URL to open when clicked
 */
export async function sendNotificationToUsers(tokens, title, body, url = '/') {
  if (!tokens || tokens.length === 0) {
    console.log('No tokens to send to')
    return { success: 0, failure: 0 }
  }

  try {
    // Firebase allows max 500 tokens per batch
    const batches = []
    for (let i = 0; i < tokens.length; i += 500) {
      batches.push(tokens.slice(i, i + 500))
    }

    let totalSuccess = 0
    let totalFailure = 0

    for (const batch of batches) {
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          url,
        },
        tokens: batch,
      }

      const response = await admin.messaging().sendMulticast(message)
      
      totalSuccess += response.successCount
      totalFailure += response.failureCount

      console.log(`Batch sent: ${response.successCount} success, ${response.failureCount} failed`)

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            invalidTokens.push(batch[idx])
          }
        })
        
        // TODO: Remove invalid tokens from database
        console.log('Invalid tokens:', invalidTokens)
      }
    }

    return { success: totalSuccess, failure: totalFailure }
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

/**
 * Send notification to all users
 * @param {string} title
 * @param {string} body
 * @param {string} url
 */
export async function sendNotificationToAll(title, body, url = '/') {
  try {
    console.log('🌍 Connecting to DB to fetch users...')
    
    // 1. Connect to the database
    const client = await clientPromise
    const db = client.db() // Uses the default DB from your URI
    
    // 2. Fetch all users who have a token
    // ⚠️ IMPORTANT: Ensure your collection is named 'users' (lowercase)
    const users = await db.collection('users')
      .find({ 
        fcmToken: { $exists: true, $ne: null, $ne: '' } 
      })
      .project({ fcmToken: 1 }) // Only fetch the token field (faster)
      .toArray()

    if (!users || users.length === 0) {
      console.log('⚠️ No users found with tokens.')
      return { success: 0, failure: 0 }
    }

    // 3. Extract tokens into a clean array
    const tokens = users.map(user => user.fcmToken)
    console.log(`🚀 Found ${tokens.length} devices. Sending broadcast...`)

    // 4. Send using your existing helper
    return await sendNotificationToUsers(tokens, title, body, url)

  } catch (error) {
    console.error('❌ Broadcast failed:', error)
    return { success: 0, failure: 0 }
  }
}