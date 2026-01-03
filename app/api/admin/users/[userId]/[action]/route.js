import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request, context) {
  try {
    // 1. Unwrap params (Next.js 15 requirement)
    const { userId, action } = await context.params
    
    
    const db = await getDb()
    // 2. Determine new status
    const newStatus = action === 'ban' ? 'banned' : 'active'

    // 3. Update User
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { status: newStatus } }
    )

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}