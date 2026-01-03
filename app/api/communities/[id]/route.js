import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// 👇 1. GET Function (To fix the "Unexpected end of JSON" error)
export async function GET(request, context) {
  try {
    const { id } = await context.params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    
    const db = await getDb()
    const community = await db.collection('communities').findOne({ _id: new ObjectId(id) })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    return NextResponse.json({ community })

  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

// 👇 2. DELETE Function (Your fixed admin code)
export async function DELETE(request, context) {
  try {
    // A. Verify Token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 })
    }

    // B. Connect to DB & Fetch User Email
    
    const db = await getDb()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { email: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // C. Check Admin Email
    if (user.email !== 'kandula_b220941ec@nitc.ac.in') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    // D. Proceed with Deletion
    const { id } = await context.params
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Community ID' }, { status: 400 })
    }

    const result = await db.collection('communities').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Cleanup posts
    await db.collection('posts').deleteMany({ communityId: id })

    return NextResponse.json({ success: true, message: 'Community deleted' })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}