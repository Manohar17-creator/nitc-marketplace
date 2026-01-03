import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    
    const db = await getDb()    
    // Fetch all users, sorted by newest
    const users = await db.collection('users')
      .find({})
      .project({ name: 1, email: 1, status: 1, createdAt: 1 }) // Only get needed fields
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}