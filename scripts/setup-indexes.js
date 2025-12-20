const { MongoClient } = require('mongodb')

require('dotenv').config({ path: '.env.local' }); // Load env vars first

async function setupIndexes() {
  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('nitc-marketplace')

    console.log('Creating indexes...')

    // Users
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    
    // Listings
    await db.collection('listings').createIndex({ category: 1, status: 1 })
    await db.collection('listings').createIndex({ createdAt: -1 })
    await db.collection('listings').createIndex({ 
      title: 'text', 
      description: 'text' 
    })

    // TTL: Auto-delete sold listings after 30 days
    await db.collection('listings').createIndex(
      { updatedAt: 1 },
      { 
        expireAfterSeconds: 30 * 24 * 60 * 60,
        partialFilterExpression: { status: 'sold' }
      }
    )

    // Notifications
    await db.collection('notifications').createIndex({ userId: 1, read: 1 })
    await db.collection('notifications').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 90 * 24 * 60 * 60 } // Delete after 90 days
    )

    console.log('✅ All indexes created!')
  } finally {
    await client.close()
  }
}

setupIndexes()