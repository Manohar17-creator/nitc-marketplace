import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch calendar, contacts, and documents (Public)
export async function GET() {
  try {
    const db = await getDb()
    
    const calendar = await db.collection('campus_resources').findOne({ type: 'calendar' })
    const contacts = await db.collection('campus_resources')
      .find({ type: 'contact' })
      .sort({ createdAt: -1 })
      .toArray()
    const documents = await db.collection('campus_resources')
      .find({ type: 'document' })
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json({
      calendar,
      contacts,
      documents
    })
  } catch (error) {
    console.error('GET /api/campus-resources error:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

// POST - Create/Update calendar, add contact, or add document (Admin only)
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin
    if (user.email !== 'kandula_b220941ec@nitc.ac.in') {
      return NextResponse.json({ 
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { type, imageUrl, imageUrls, title } = body

    if (type === 'calendar') {
      // Replace existing calendar
      const result = await db.collection('campus_resources').findOneAndUpdate(
        { type: 'calendar' },
        { 
          $set: { 
            type: 'calendar', 
            imageUrl, 
            updatedAt: new Date() 
          }
        },
        { upsert: true, returnDocument: 'after' }
      )
      return NextResponse.json({ success: true, calendar: result.value })
    } 
    else if (type === 'contact') {
      // Add new contact sheet
      const contact = {
        type: 'contact',
        imageUrl,
        title: title || 'Contact Sheet',
        createdAt: new Date()
      }
      const result = await db.collection('campus_resources').insertOne(contact)
      return NextResponse.json({ 
        success: true, 
        contact: { ...contact, _id: result.insertedId } 
      })
    }
    else if (type === 'document') {
      // Add new document with multiple images
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return NextResponse.json({ error: 'imageUrls array is required' }, { status: 400 })
      }

      const document = {
        type: 'document',
        imageUrls,
        title: title || 'Document',
        createdAt: new Date()
      }
      const result = await db.collection('campus_resources').insertOne(document)
      return NextResponse.json({ 
        success: true, 
        document: { ...document, _id: result.insertedId } 
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('POST /api/campus-resources error:', error)
    return NextResponse.json({ error: 'Failed to save resource', details: error.message }, { status: 500 })
  }
}

// DELETE - Remove a contact sheet or document (Admin only)
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin
    if (user.email !== 'kandula_b220941ec@nitc.ac.in') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.collection('campus_resources').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/campus-resources error:', error)
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
  }
}