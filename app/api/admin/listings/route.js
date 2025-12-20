import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET ALL LISTINGS (For Admin Panel)
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('nitc-marketplace')
    
    const listings = await db.collection('listings')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100) // Safety limit
      .toArray()

    return NextResponse.json({ listings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

// DELETE LISTING (Admin Override)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    await db.collection('listings').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}