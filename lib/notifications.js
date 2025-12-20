import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function createNotification({ userId, title, message, type = 'info', link = null }) {
  const client = await clientPromise
  const db = client.db('nitc-marketplace')

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

export async function broadcastNotification({ title, message, type = 'info', link = null }) {
  const client = await clientPromise
  const db = client.db('nitc-marketplace')

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
}