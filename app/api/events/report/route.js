import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { eventId } = await request.json()
    const client = await clientPromise
    const db = client.db('nitc-marketplace')
    
    const userId = new ObjectId(decoded.userId)
    const eventObjectId = new ObjectId(eventId)

    // Add user to report list
    const result = await db.collection('events').findOneAndUpdate(
      { _id: eventObjectId },
      { $addToSet: { reports: userId } },
      { returnDocument: 'after' }
    )

    if (!result || !result.value) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Auto-Hide if reports >= 3
    if (result.value.reports && result.value.reports.length >= 10) {
      await db.collection('events').updateOne(
        { _id: eventObjectId },
        { $set: { hidden: true } }
      )
    }

    return NextResponse.json({ success: true, message: 'Report submitted' })
  } catch (error) {
    return NextResponse.json({ error: 'Report failed' }, { status: 500 })
  }
}