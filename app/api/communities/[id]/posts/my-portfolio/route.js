import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - User's own portfolio posts
export async function GET(request, context) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ posts: [] })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ posts: [] })
    }

    
    const db = await getDb()
    // Get only current user's portfolio posts
    const posts = await db
      .collection('community_posts')
      .find({
        communityId: new ObjectId(id),
        authorId: new ObjectId(decoded.userId),
        type: 'portfolio'
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ posts })

  } catch (error) {
    console.error('Get portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}