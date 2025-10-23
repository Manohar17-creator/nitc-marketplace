import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
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

    // Get user info
    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    const { name, description, icon, color } = data

    // Check if community with same name already exists or is pending
    const existing = await db.collection('communities').findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Community with this name already exists' },
        { status: 400 }
      )
    }

    const pendingRequest = await db.collection('community_requests').findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      status: 'pending'
    })

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'A request for this community is already pending' },
        { status: 400 }
      )
    }

    // Create request
    const result = await db.collection('community_requests').insertOne({
      name,
      description,
      icon,
      color,
      requestedBy: new ObjectId(decoded.userId),
      requestedByName: user.name,
      requestedByEmail: user.email,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date()
    })

    return NextResponse.json({
      message: 'Community request submitted successfully',
      requestId: result.insertedId
    })

  } catch (error) {
    console.error('Community request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}