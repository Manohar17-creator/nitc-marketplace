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
    await db.collection('community_requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: new ObjectId(decoded.userId)
        } 
      }
    )

    return NextResponse.json({ message: 'Request rejected' })

  } catch (error) {
    console.error('Reject error:', error)
    return NextResponse.json(
      { error: 'Failed to reject' },
      { status: 500 }
    )
  }
}