import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Fetch all communities
export async function GET(request) {
  try {
    
    const db = await getDb()
    const communities = await db
      .collection('communities')
      .find({})
      .sort({ memberCount: -1 })
      .toArray()

    return NextResponse.json({ communities })

  } catch (error) {
    console.error('Get communities error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}

// POST - Create new community (admin only for now)
export async function POST(request) {
  try {
    const data = await request.json()
    const { name, description, icon, color, category } = data

    
    const db = await getDb()
    const result = await db.collection('communities').insertOne({
      name,
      description,
      icon,
      color,
      category,
      memberCount: 0,
      postCount: 0,
      createdAt: new Date()
    })

    return NextResponse.json({
      message: 'Community created',
      communityId: result.insertedId
    })

  } catch (error) {
    console.error('Create community error:', error)
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    )
  }
}