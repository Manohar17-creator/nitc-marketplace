import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { verifyToken } from '@/lib/auth'

// --------------------
// Helper: Admin Check
// --------------------
const isAdmin = async (req) => {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return false

  const decoded = await verifyToken(token)
  if (!decoded?.userId) return false

  const db = await getDb()

  const user = await db.collection('users').findOne({
    _id: new ObjectId(decoded.userId)
  })

  return user?.email === 'kandula_b220941ec@nitc.ac.in'
}

// --------------------
// CREATE AD
// --------------------
export async function POST(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, imageUrl, link, type, description } = await request.json()
  const db = await getDb()

  await db.collection('ads').insertOne({
    title,
    imageUrl,
    link,
    type,
    description:
      description ||
      (type === 'local' ? 'Support local business' : 'Check this out'),
    active: true,
    clicks: 0,
    createdAt: new Date()
  })

  return NextResponse.json({ success: true })
}

// --------------------
// UPDATE AD
// --------------------
export async function PUT(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { _id, title, imageUrl, link, type, description } =
    await request.json()

  const db = await getDb()

  await db.collection('ads').updateOne(
    { _id: new ObjectId(_id) },
    {
      $set: {
        title,
        imageUrl,
        link,
        type,
        description
      }
    }
  )

  return NextResponse.json({ success: true })
}

// --------------------
// DELETE AD
// --------------------
export async function DELETE(request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const db = await getDb()

  await db.collection('ads').deleteOne({
    _id: new ObjectId(id)
  })

  return NextResponse.json({ success: true })
}
