import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request, context) {
  try {
    const { id, userId } = await context.params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'feed'

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Get member info
    const member = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Get member's posts based on type
    let query = {
      communityId: new ObjectId(id),
      authorId: new ObjectId(userId)
    }

    if (type === 'feed') {
      // Feed includes feed and job posts, NOT portfolio
      query.type = { $in: ['feed', 'job'] }
    } else if (type === 'portfolio') {
      // Only portfolio posts
      query.type = 'portfolio'
    }

    const posts = await db
      .collection('community_posts')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      member: {
        name: member.name,
        email: member.email
      },
      posts
    })

  } catch (error) {
    console.error('Get member portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member data' },
      { status: 500 }
    )
  }
}