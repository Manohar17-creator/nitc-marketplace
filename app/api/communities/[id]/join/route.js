import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// POST - Join community
export async function POST(request, context) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Check if already a member
    const existing = await db.collection('community_members').findOne({
      userId: new ObjectId(decoded.userId),
      communityId: new ObjectId(id)
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already a member' },
        { status: 400 }
      )
    }

    // Add member
    await db.collection('community_members').insertOne({
      userId: new ObjectId(decoded.userId),
      communityId: new ObjectId(id),
      role: 'member',
      joinedAt: new Date()
    })

    // Increment member count
    await db.collection('communities').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { memberCount: 1 } }
    )

    return NextResponse.json({ message: 'Joined successfully' })

  } catch (error) {
    console.error('Join community error:', error)
    return NextResponse.json(
      { error: 'Failed to join community' },
      { status: 500 }
    )
  }
}

// DELETE - Leave community
export async function DELETE(request, context) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    await db.collection('community_members').deleteOne({
      userId: new ObjectId(decoded.userId),
      communityId: new ObjectId(id)
    })

    // Decrement member count
    await db.collection('communities').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { memberCount: -1 } }
    )

    return NextResponse.json({ message: 'Left community' })

  } catch (error) {
    console.error('Leave community error:', error)
    return NextResponse.json(
      { error: 'Failed to leave community' },
      { status: 500 }
    )
  }
}