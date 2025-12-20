import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// DELETE: Delete an event (Admin or Owner)
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    const event = await db.collection('events').findOne({ _id: new ObjectId(id) })

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Check Permissions: Admin or Owner
    // 👇 UPDATE WITH YOUR ADMIN EMAIL
    const isAdmin = user?.email === 'kandula_b220941ec@nitc.ac.in' 
    const isOwner = event.organizer.id.toString() === decoded.userId

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    await db.collection('events').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: 'Event deleted' })

  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

// PUT: Edit an event (Owner only)
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { title, description, venue, eventDate, image } = data

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const event = await db.collection('events').findOne({ _id: new ObjectId(id) })
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Only Owner can edit
    if (event.organizer.id.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Only the organizer can edit this' }, { status: 403 })
    }

    const updateData = {
      title,
      description,
      venue,
      eventDate: new Date(eventDate),
      image,
      updatedAt: new Date()
    }

    await db.collection('events').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true, message: 'Event updated' })

  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}