import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request, context) {
  try {
    const { requestId } = await context.params
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    
    const db = await getDb()
    // Get the request
    const communityRequest = await db.collection('community_requests').findOne({
      _id: new ObjectId(requestId)
    })

    if (!communityRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Create the community
    const result = await db.collection('communities').insertOne({
      name: communityRequest.name,
      description: communityRequest.description,
      icon: communityRequest.icon,
      color: communityRequest.color,
      memberCount: 0,
      postCount: 0,
      createdBy: communityRequest.requestedBy,
      createdAt: new Date()
    })

    // Update request status
    await db.collection('community_requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: new ObjectId(decoded.userId)
        } 
      }
    )

    return NextResponse.json({
      message: 'Community approved',
      communityId: result.insertedId
    })

  } catch (error) {
    console.error('Approve error:', error)
    return NextResponse.json(
      { error: 'Failed to approve' },
      { status: 500 }
    )
  }
}