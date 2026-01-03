import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { adId } = await request.json()
    
    const db = await getDb()
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