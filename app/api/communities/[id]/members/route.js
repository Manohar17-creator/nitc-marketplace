import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Fetch community members
export async function GET(request, context) {
  try {
    const { id } = await context.params

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    const members = await db
      .collection('community_members')
      .aggregate([
        { $match: { communityId: new ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $project: {
            userId: 1,
            name: '$userInfo.name',
            email: '$userInfo.email',
            joinedAt: 1
          }
        },
        { $sort: { joinedAt: -1 } }
      ])
      .toArray()

    return NextResponse.json({ members })

  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}