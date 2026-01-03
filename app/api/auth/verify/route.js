import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyToken, generateToken } from '@/lib/auth' // 👈 Added generateToken
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const { token } = await request.json()

    // 1. Verify the specific "Email Verification Token"
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    
    const db = await getDb();    const userId = new ObjectId(decoded.userId)

    // 2. Mark User as Verified in DB
    const updateResult = await db.collection('users').findOneAndUpdate(
      { _id: userId },
      { $set: { isVerified: true } },
      { returnDocument: 'after' } // Returns the updated user document
    )

    // Check if user was actually found/updated
    if (!updateResult) { 
        // Note: MongoDB driver v4+ might return result in .value, v6+ in directly
        // If updateResult is null, try finding user manually
         const userCheck = await db.collection('users').findOne({ _id: userId })
         if(!userCheck) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. 🚀 FETCH UPDATED USER & GENERATE LOGIN TOKEN
    // We need the user details to send back to the frontend
    const user = await db.collection('users').findOne({ _id: userId })
    
    // Generate a fresh "Session Token" (JWT) for login
    const sessionToken = generateToken(user._id.toString())

    // 4. Return Success + Token + User Data
    return NextResponse.json({ 
      message: 'Email verified successfully',
      token: sessionToken, // 👈 This enables Auto-Login
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        hostel: user.hostel,
        isVerified: true
      }
    })

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}