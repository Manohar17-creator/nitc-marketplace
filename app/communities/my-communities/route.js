import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ communityIds: [] })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ communityIds: [] })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const memberships = await db
      .collection('community_members')
      .find({ userId: new ObjectId(decoded.userId) })
      .toArray()

    const communityIds = memberships.map(m => m.communityId.toString())

    return NextResponse.json({ communityIds })

  } catch (error) {
    console.error('Get my communities error:', error)
    return NextResponse.json({ communityIds: [] })
  }
}