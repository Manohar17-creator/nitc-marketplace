import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

const ADMIN_EMAIL = 'kandula_b220941ec@nitc.ac.in';

export async function GET() {
  try {
    const db = await getDb()
    const calendar = await db.collection('campus_resources').findOne({ type: 'calendar' })
    
    const contacts = await db.collection('campus_resources')
      .find({ type: 'contact' })
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray()

    const documents = await db.collection('campus_resources')
      .find({ type: 'document' })
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray()
    
    return NextResponse.json({ calendar, contacts, documents })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const decoded = verifyToken(authHeader?.replace('Bearer ', ''))
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    if (user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { type, imageUrl, imageUrls, title } = body

    if (type === 'calendar') {
      await db.collection('campus_resources').updateOne(
        { type: 'calendar' },
        { $set: { imageUrl, updatedAt: new Date() } },
        { upsert: true }
      )
      return NextResponse.json({ success: true })
    } 

    const currentCount = await db.collection('campus_resources').countDocuments({ type })
    const newItem = {
      type,
      title: title || 'Untitled',
      createdAt: new Date(),
      sortOrder: currentCount, 
      ...(type === 'contact' ? { imageUrl } : { imageUrls })
    }

    const result = await db.collection('campus_resources').insertOne(newItem)
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const decoded = verifyToken(authHeader?.replace('Bearer ', ''))
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = await getDb()
    const { items } = await request.json()

    const updates = items.map(item => 
      db.collection('campus_resources').updateOne(
        { _id: new ObjectId(item.id) },
        { $set: { sortOrder: item.sortOrder } }
      )
    )

    await Promise.all(updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const decoded = verifyToken(authHeader?.replace('Bearer ', ''))
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    if (user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await db.collection('campus_resources').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}