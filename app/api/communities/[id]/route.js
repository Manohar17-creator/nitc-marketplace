import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Single community details
export async function GET(request, context) {
  try {
    const { id } = await context.params

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const community = await db.collection('communities').findOne({
      _id: new ObjectId(id)
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ community })

  } catch (error) {
    console.error('Get community error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community' },
      { status: 500 }
    )
  }
}