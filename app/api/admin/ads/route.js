import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// Helper for Admin Check
const isAdmin = async (req) => {
  const token = req.headers.get('authorization')?.split(' ')[1]
  const decoded = await verifyToken(token)
  if (!decoded?.userId) return false
  const client = await clientPromise
  const user = await client.db('nitc-marketplace').collection('users').findOne({ _id: new ObjectId(decoded.userId) })
  return user?.email === 'kandula_b220941ec@nitc.ac.in'
}

export async function POST(request) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, imageUrl, link, type, description } = await request.json() // 👈 Added description
  const client = await clientPromise
  
  await client.db('nitc-marketplace').collection('ads').insertOne({
    title,
    imageUrl,
    link,
    type,
    description: description || (type === 'local' ? 'Support local business' : 'Check this out'), // Default fallback
    active: true,
    clicks: 0,
    createdAt: new Date()
  })

  return NextResponse.json({ success: true })
}

export async function PUT(request) { // 👈 NEW: Handle Edits
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { _id, title, imageUrl, link, type, description } = await request.json()
  const client = await clientPromise

  await client.db('nitc-marketplace').collection('ads').updateOne(
    { _id: new ObjectId(_id) },
    { $set: { title, imageUrl, link, type, description } }
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  if (!await isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const client = await clientPromise
  
  await client.db('nitc-marketplace').collection('ads').deleteOne({ _id: new ObjectId(id) })
  return NextResponse.json({ success: true })
}