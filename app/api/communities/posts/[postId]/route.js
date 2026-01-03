import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Single post details
export async function GET(request, context) {
  try {
    const { postId } = await context.params

    if (!ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    
    const db = await getDb()
    const post = await db.collection('community_posts').findOne({
      _id: new ObjectId(postId)
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ post })

  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// ← ADD THIS DELETE METHOD
export async function DELETE(request, context) {
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

    
    const db = await getDb()
    // Get post to check ownership
    const post = await db.collection('community_posts').findOne({
      _id: new ObjectId(postId)
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user owns the post
    if (post.authorId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      )
    }

    // Delete all comments for this post
    await db.collection('post_comments').deleteMany({
      postId: new ObjectId(postId)
    })

    // Delete post
    await db.collection('community_posts').deleteOne({
      _id: new ObjectId(postId)
    })

    // Decrement post count
    await db.collection('communities').updateOne(
      { _id: post.communityId },
      { $inc: { postCount: -1 } }
    )

    return NextResponse.json({ message: 'Post deleted' })

  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}