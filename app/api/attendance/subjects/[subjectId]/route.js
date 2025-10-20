import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// DELETE - Remove subject
export async function DELETE(request, context) {
  try {
    const { subjectId } = await context.params
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

    // Delete subject
    await db.collection('subjects').deleteOne({
      _id: new ObjectId(subjectId),
      userId: new ObjectId(decoded.userId)
    })

    // Delete all attendance records for this subject
    await db.collection('attendance').deleteMany({
      subjectId: new ObjectId(subjectId)
    })

    return NextResponse.json({ message: 'Subject deleted' })

  } catch (error) {
    console.error('Delete subject error:', error)
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}