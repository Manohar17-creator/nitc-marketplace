import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request, context) {
  const { id } = await context.params
  
  const db = await getDb()
  await db.collection('notifications').updateOne(
    { _id: new ObjectId(id) },
    { $set: { read: true } }
  )

  return NextResponse.json({ success: true })
}