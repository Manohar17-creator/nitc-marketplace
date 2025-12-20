import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { adId } = await request.json()
    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Increment 'views' by 1
    await db.collection('ads').updateOne(
      { _id: new ObjectId(adId) },
      { $inc: { views: 1 } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
  }
}