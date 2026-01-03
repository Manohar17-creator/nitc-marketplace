import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// --- 1. GET: Fetch a single event (Required for Pre-filling Edit Form) ---
export async function GET(request, context) {
  try {
    const params = await context.params
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    
    const db = await getDb()
    const event = await db.collection('events').findOne({
      _id: new ObjectId(id)
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Fetch event error:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

// --- 2. PUT: Edit an event details ---
export async function PUT(request, context) {
  try {
    const params = await context.params
    const id = params.id
    
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { title, description, venue, eventDate, image } = data

    
    const db = await getDb()
    const event = await db.collection('events').findOne({ _id: new ObjectId(id) })
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Permission Check: Organizer or Admin
    const isOwner = event.organizer.id.toString() === decoded.userId
    const isAdmin = decoded.email === 'kandula_b220941ec@nitc.ac.in'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const updateData = {
      title,
      description,
      venue,
      eventDate: new Date(eventDate),
      image: image || event.image, // Keep old image if new one isn't provided
      updatedAt: new Date()
    }

    await db.collection('events').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ success: true, message: 'Event updated' })

  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// --- 3. DELETE: Remove an event ---
export async function DELETE(request, context) {
  try {
    const params = await context.params
    const id = params.id
    
    const token = request.headers.get('authorization')?.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    
    const db = await getDb()
    const event = await db.collection('events').findOne({ _id: new ObjectId(id) })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Check Permissions
    const isAdmin = decoded.email === 'kandula_b220941ec@nitc.ac.in' 
    const isOwner = event.organizer.id.toString() === decoded.userId

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    await db.collection('events').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: 'Event deleted' })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}