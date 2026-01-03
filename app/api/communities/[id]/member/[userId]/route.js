import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request, context) {
  try {
    const { id, userId } = await context.params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'feed'

    
    const db = await getDb()
    // ✅ Fetch the full user document to get the latest picture
    const member = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    let query = {
      communityId: new ObjectId(id),
      authorId: new ObjectId(userId)
    }

    if (type === 'feed') {
      query.type = { $in: ['feed', 'job'] }
    } else if (type === 'portfolio') {
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
        email: member.email,
        // ✅ ADDED: Return the Cloudinary picture URL
        picture: member.picture || '' 
      },
      posts
    })

  } catch (error) {
    console.error('Get member portfolio error:', error)
    return NextResponse.json({ error: 'Failed to fetch member data' }, { status: 500 })
  }
}