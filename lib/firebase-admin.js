import admin from 'firebase-admin'
import { getDb } from '@/lib/mongodb'

// ------------------------------------
// Firebase Admin Init (server-only)
// ------------------------------------
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
export async function sendNotificationToUsers(
  tokens,
  title,
  body,
  url = '/'
) {
  if (!tokens || tokens.length === 0) {
    console.log('⚠️ No tokens to send to')
    return { success: 0, failure: 0 }
  }

  try {
    // Firebase max = 500 tokens per batch
    const batches = []
    for (let i = 0; i < tokens.length; i += 500) {
      batches.push(tokens.slice(i, i + 500))
    }

    let totalSuccess = 0
    let totalFailure = 0

    for (const batch of batches) {
      const message = {
        notification: { title, body },
        data: { url },
        tokens: batch,
      }

      const response = await admin.messaging().sendMulticast(message)

      totalSuccess += response.successCount
      totalFailure += response.failureCount

      console.log(
        `📦 Batch sent: ${response.successCount} success, ${response.failureCount} failed`
      )

      // Collect invalid tokens (optional cleanup hook)
      if (response.failureCount > 0) {
        const invalidTokens = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success) invalidTokens.push(batch[idx])
        })

        console.log('🧹 Invalid tokens:', invalidTokens)
        // 👉 You can remove these tokens from DB here if you want
      }
    }

    return { success: totalSuccess, failure: totalFailure }
  } catch (error) {
    console.error('❌ Error sending notification:', error)
    throw error
  }
}

/**
 * Send notification to ALL users with FCM tokens
 * @param {string} title
 * @param {string} body
 * @param {string} url
 */
export async function sendNotificationToAll(
  title,
  body,
  url = '/'
) {
  try {
    console.log('🌍 Fetching users for broadcast...')

    // ✅ Correct DB access
    const db = await getDb()

    const users = await db
      .collection('users')
      .find({
        fcmToken: { $exists: true, $ne: null, $ne: '' },
      })
      .project({ fcmToken: 1 })
      .toArray()

    if (!users.length) {
      console.log('⚠️ No users with FCM tokens found')
      return { success: 0, failure: 0 }
    }

    const tokens = users.map(u => u.fcmToken)

    console.log(`🚀 Broadcasting to ${tokens.length} devices...`)

    return await sendNotificationToUsers(tokens, title, body, url)
  } catch (error) {
    console.error('❌ Broadcast failed:', error)
    return { success: 0, failure: 0 }
  }
}
