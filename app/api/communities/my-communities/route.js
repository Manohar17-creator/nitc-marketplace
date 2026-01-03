import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) return NextResponse.json({ communityIds: [] })

    const decoded = await verifyToken(token) // ensure verifyToken is awaited if it's async
    if (!decoded) return NextResponse.json({ communityIds: [] })

    
    const db = await getDb()
    // ⚡ OPTIMIZATION 1: Use Projection
    // Only fetch the 'communityId' field. Don't fetch the whole document.
    const memberships = await db
      .collection('community_members')
      .find({ userId: new ObjectId(decoded.userId) })
      .project({ communityId: 1, _id: 0 }) 
      .toArray()

    const communityIds = memberships.map(m => m.communityId.toString())

    return NextResponse.json({ communityIds })

  } catch (error) {
    console.error('Get my communities error:', error)
    return NextResponse.json({ communityIds: [] })
  }
}