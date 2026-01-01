import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb' // 👈 Import ObjectId

export async function POST(request) {
  try {
    const { subject, message } = await request.json()
    
    // Default values
    let userEmail = 'Anonymous'
    let userId = null
    let userName = 'Guest'

    // 1. Check for Token
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = verifyToken(token) 
        
        if (decoded && decoded.userId) {
            userId = decoded.userId
            
            // 2. 🔍 LOOK UP USER IN DATABASE
            // This guarantees we get the real, current name (e.g., "Manohar")
            const client = await clientPromise
            const db = client.db('nitc-marketplace')
            
            // Try to find the user to get exact details
            try {
                const userProfile = await db.collection('users').findOne({ 
                    _id: new ObjectId(userId) 
                })

                if (userProfile) {
                    userName = userProfile.name || 'App User'
                    userEmail = userProfile.email || 'No Email'
                } else {
                    // Fallback to token data if DB lookup fails
                    userEmail = decoded.email
                }
            } catch (dbError) {
                console.error("User DB lookup failed:", dbError)
                userEmail = decoded.email // Fallback
            }
        }
      } catch (e) {
        console.error('Token verification failed', e)
      }
    }

    // 3. Save Message
    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    await db.collection('messages').insertOne({
      subject,
      message,
      userEmail, 
      userId,
      userName, // 👈 Now this will be "Manohar"
      read: false,
      createdAt: new Date()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact API Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}