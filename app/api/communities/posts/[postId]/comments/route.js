import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch comments
export async function GET(request, context) {
  try {
    const { postId } = await context.params

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const comments = await db
      .collection('post_comments')
      .find({ postId: new ObjectId(postId) })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({ comments })

  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST - Add comment
export async function POST(request, context) {
  try {
    const { postId } = await context.params
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

    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId)
    })

    const { content } = await request.json()

    await db.collection('post_comments').insertOne({
      postId: new ObjectId(postId),
      authorId: new ObjectId(decoded.userId),
      authorName: user.name,
      content,
      createdAt: new Date()
    })

    // Increment comment count
    await db.collection('community_posts').updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { commentCount: 1 } }
    )

    return NextResponse.json({ message: 'Comment added' })

  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}