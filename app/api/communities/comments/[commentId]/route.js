import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// DELETE - Delete comment
export async function DELETE(request, context) {
  try {
    const { commentId } = await context.params
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

    // Get comment to check ownership
    const comment = await db.collection('post_comments').findOne({
      _id: new ObjectId(commentId)
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user owns the comment
    if (comment.authorId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    // Delete comment
    await db.collection('post_comments').deleteOne({
      _id: new ObjectId(commentId)
    })

    // Decrement comment count
    await db.collection('community_posts').updateOne(
      { _id: comment.postId },
      { $inc: { commentCount: -1 } }
    )

    return NextResponse.json({ message: 'Comment deleted' })

  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}