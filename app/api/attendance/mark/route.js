import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// POST - Mark attendance for a date
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { date, attendance } = await request.json()
    // attendance is an array: [{ subjectId, status, reason }]

    if (!date || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // Delete existing attendance for this date (if updating)
    await db.collection('attendance').deleteMany({
      userId: new ObjectId(decoded.userId),
      date: new Date(date)
    })

    // Insert new attendance records
    const records = attendance.map(att => ({
      userId: new ObjectId(decoded.userId),
      subjectId: new ObjectId(att.subjectId),
      date: new Date(date),
      status: att.status, // present, absent, noclass
      reason: att.reason || null, // placement, medical, none
      createdAt: new Date()
    }))

    if (records.length > 0) {
      await db.collection('attendance').insertMany(records)
    }

    return NextResponse.json({ message: 'Attendance marked' })

  } catch (error) {
    console.error('Mark attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}