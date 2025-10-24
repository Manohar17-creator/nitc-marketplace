import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET Comments
export async function GET(request, context) {
  try {
    const { postId } = await context.params
    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const comments = await db
      .collection('post_comments')
      .find({
        $or: [
          { postId: new ObjectId(postId) },
          { postId } // fallback if stored as string
        ]
      })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST Comment
export async function POST(request, context) {
  try {
    const { postId } = await context.params
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { content } = await request.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 })

    await db.collection('post_comments').insertOne({
      postId: new ObjectId(postId),
      authorId: new ObjectId(decoded.userId),
      authorName: user.name,
      content,
      createdAt: new Date()
    })

    await db.collection('community_posts').updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { commentCount: 1 } }
    )

    return NextResponse.json({ message: 'Comment added successfully' })
  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
