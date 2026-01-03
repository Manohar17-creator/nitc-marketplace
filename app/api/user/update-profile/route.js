import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // ✅ Destructure additional fields: picture and location
    const { name, phone, picture, location } = await request.json()

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    
    const db = await getDb()
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          name: name.trim(), 
          phone: phone.trim(),
          picture: picture || null, // ✅ Save Cloudinary URL to database
          location: location || '',
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' } // Ensure the updated doc is returned
    )

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = {
      id: result._id.toString(),
      name: result.name,
      email: result.email,
      phone: result.phone,
      isVerified: result.isVerified,
      picture: result.picture || '',
      location: result.location || ''
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}