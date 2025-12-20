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

    const event = await db.collection('events').findOne({ _id: eventObjectId, interested: userId })

    if (event) {
      await db.collection('events').updateOne({ _id: eventObjectId }, { $pull: { interested: userId } })
      return NextResponse.json({ interested: false })
    } else {
      await db.collection('events').updateOne({ _id: eventObjectId }, { $addToSet: { interested: userId } })
      return NextResponse.json({ interested: true })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}