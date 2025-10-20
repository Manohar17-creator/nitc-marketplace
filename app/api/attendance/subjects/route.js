import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch all subjects for user
export async function GET(request) {
  try {
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

    const subjects = await db
      .collection('subjects')
      .find({ userId: new ObjectId(decoded.userId) })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({ subjects })

  } catch (error) {
    console.error('Get subjects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}

// POST - Add new subject
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Subject name is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Check if subject already exists
    const existing = await db.collection('subjects').findOne({
      userId: new ObjectId(decoded.userId),
      name: name.trim()
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Subject already exists' },
        { status: 400 }
      )
    }

    const result = await db.collection('subjects').insertOne({
      userId: new ObjectId(decoded.userId),
      name: name.trim(),
      createdAt: new Date()
    })

    return NextResponse.json({
      message: 'Subject added',
      subjectId: result.insertedId
    })

  } catch (error) {
    console.error('Add subject error:', error)
    return NextResponse.json(
      { error: 'Failed to add subject' },
      { status: 500 }
    )
  }
}