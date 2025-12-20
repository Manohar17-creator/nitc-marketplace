import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request, context) {
  const { id } = await context.params
  const client = await clientPromise
  const db = client.db('nitc-marketplace')

  await db.collection('notifications').updateOne(
    { _id: new ObjectId(id) },
    { $set: { read: true } }
  )

  return NextResponse.json({ success: true })
}