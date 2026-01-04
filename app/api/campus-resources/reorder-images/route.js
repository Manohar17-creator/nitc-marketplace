import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

const ADMIN_EMAIL = 'kandula_b220941ec@nitc.ac.in';

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const decoded = verifyToken(authHeader?.replace('Bearer ', ''))
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) })
    if (user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { documentId, imageUrls } = body

    if (!documentId || !imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    await db.collection('campus_resources').updateOne(
      { _id: new ObjectId(documentId) },
      { $set: { imageUrls, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}