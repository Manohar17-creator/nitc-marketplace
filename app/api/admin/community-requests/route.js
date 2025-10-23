import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // TODO: Add proper admin check
    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    })

    // Check if admin (replace with your admin email)
    if (user.email !== 'kandula_b220941ec@nitc.ac.in') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const requests = await db
      .collection('community_requests')
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ requests })

  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}