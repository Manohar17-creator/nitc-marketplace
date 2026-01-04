import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { eventId } = await request.json()
    const db = await getDb()
    const userId = new ObjectId(decoded.userId)
    const eventObjectId = new ObjectId(eventId)

    // Check current status
    const event = await db.collection('events').findOne({ 
      _id: eventObjectId, 
      interested: userId 
    })

    if (event) {
      // 1. Remove user from event list
      // 2. Remove event from user's "interested" list
      await Promise.all([
        db.collection('events').updateOne({ _id: eventObjectId }, { $pull: { interested: userId } }),
        db.collection('users').updateOne({ _id: userId }, { $pull: { interestedEvents: eventObjectId } })
      ])
      return NextResponse.json({ interested: false })
    } else {
      // 1. Add user to event list
      // 2. Add event to user's "interested" list
      await Promise.all([
        db.collection('events').updateOne({ _id: eventObjectId }, { $addToSet: { interested: userId } }),
        db.collection('users').updateOne({ _id: userId }, { $addToSet: { interestedEvents: eventObjectId } })
      ])
      return NextResponse.json({ interested: true })
    }
  } catch (error) {
    console.error("Interested error:", error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}