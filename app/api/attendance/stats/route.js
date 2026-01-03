import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET - Calculate attendance statistics
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    
    const db = await getDb()
    // Get all subjects
    const subjects = await db
      .collection('subjects')
      .find({ userId: new ObjectId(decoded.userId) })
      .toArray()

    // Calculate stats for each subject
    const stats = await Promise.all(
      subjects.map(async (subject) => {
        const attendance = await db
          .collection('attendance')
          .find({
            userId: new ObjectId(decoded.userId),
            subjectId: subject._id
          })
          .toArray()

        // Count only classes that happened (not noclass)
        const totalClasses = attendance.filter(
          a => a.status !== 'noclass'
        ).length

        const presentClasses = attendance.filter(
          a => a.status === 'present'
        ).length

        const percentage = totalClasses > 0
          ? Math.round((presentClasses / totalClasses) * 100)
          : 0

        return {
          subjectId: subject._id,
          subjectName: subject.name,
          totalClasses,
          presentClasses,
          absentClasses: totalClasses - presentClasses,
          percentage
        }
      })
    )

    // Calculate overall stats
    const overallTotal = stats.reduce((sum, s) => sum + s.totalClasses, 0)
    const overallPresent = stats.reduce((sum, s) => sum + s.presentClasses, 0)
    const overallPercentage = overallTotal > 0
      ? Math.round((overallPresent / overallTotal) * 100)
      : 0

    return NextResponse.json({
      subjects: stats,
      overall: {
        totalClasses: overallTotal,
        presentClasses: overallPresent,
        percentage: overallPercentage
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}