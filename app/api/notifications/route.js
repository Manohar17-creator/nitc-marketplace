import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  const user = await verifyToken(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await clientPromise
  const db = client.db('nitc-marketplace')

  const notifications = await db.collection('notifications')
    .find({ userId: new ObjectId(user.userId) })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray()

  return NextResponse.json({ notifications })
}