import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PUT(request) {
  try {
    // 1. Get token from headers
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify token
    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // 3. Get body data
    const { name, phone } = await request.json()

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 4. Update the user in MongoDB
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          name: name.trim(), 
          phone: phone.trim(),
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' } // Return the updated document
    )

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 5. Return the updated user data for the client to sync
    const updatedUser = {
      id: result._id.toString(),
      name: result.name,
      email: result.email,
      phone: result.phone,
      isVerified: result.isVerified,
      picture: result.picture || '',
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}