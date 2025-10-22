import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { getIO } from '@/lib/socket'

// GET - Fetch community posts
export async function GET(request, context) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // feed, job, showcase

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    let query = { communityId: new ObjectId(id) }
    if (type && type !== 'all') {
      query.type = type
    }

    const posts = await db
      .collection('community_posts')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ posts })

  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST - Create new post
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

    const member = await db.collection('community_members').findOne({
      userId: new ObjectId(decoded.userId),
      communityId: new ObjectId(id)
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Must be a member to post' },
        { status: 403 }
      )
    }

    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    })

    const data = await request.json()
    const { type, title, content, embedUrl, embedType } = data

    const newPost = {
      communityId: new ObjectId(id),
      authorId: new ObjectId(decoded.userId),
      authorName: user.name,
      authorEmail: user.email,
      type,
      title: title || '',
      content,
      embedUrl: embedUrl || null,
      embedType: embedType || null,
      commentCount: 0,
      createdAt: new Date()
    }

    const result = await db.collection('community_posts').insertOne(newPost)

    await db.collection('communities').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { postCount: 1 } }
    )

    // ✅ EMIT WEBSOCKET EVENT
    try {
      const io = getIO()
      io.to(`community:${id}`).emit('new-post', {
        ...newPost,
        _id: result.insertedId
      })
    } catch (err) {
      console.log('Socket emit skipped (server may not be running)')
    }

    return NextResponse.json({
      message: 'Post created',
      postId: result.insertedId
    })

  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}