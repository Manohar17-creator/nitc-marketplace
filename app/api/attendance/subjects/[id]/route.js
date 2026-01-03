import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Fetch attendance records for a specific subject
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    console.log('📍 Fetching subject ID:', id)
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('👤 Decoded token:', decoded)

    
    const db = await getDb()
    // Fetch subject details
    const subject = await db.collection('subjects').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(decoded.userId)
    })

    console.log('📚 Found subject:', subject)

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Fetch attendance for this subject
    const attendance = await db
      .collection('attendance')
      .find({
        userId: new ObjectId(decoded.userId),
        subjectId: new ObjectId(id)
      })
      .sort({ date: -1 })
      .toArray()

    console.log('📊 Found attendance records:', attendance.length)

    // Add subject name to each record
    const attendanceWithName = attendance.map(record => ({
      ...record,
      _id: record._id.toString(),
      subjectId: record.subjectId.toString(),
      subjectName: subject.name
    }))

    return NextResponse.json({
      subject: {
        _id: subject._id.toString(),
        name: subject.name,
      },
      attendance: attendanceWithName,
    })

  } catch (error) {
    console.error('❌ Get subject attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance: ' + error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific subject
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    console.log('🗑️ Deleting subject ID:', id)
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    
    const db = await getDb()
    // Delete subject
    const deleteResult = await db.collection('subjects').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(decoded.userId)
    })

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Delete all attendance records for this subject
    await db.collection('attendance').deleteMany({
      userId: new ObjectId(decoded.userId),
      subjectId: new ObjectId(id)
    })

    console.log('✅ Subject deleted successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Subject deleted successfully' 
    })

  } catch (error) {
    console.error('❌ Delete subject error:', error)
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}