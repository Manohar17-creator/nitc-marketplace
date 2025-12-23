import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { broadcastNotification } from '@/lib/notifications'

export async function POST(request) {
  try {
    // 1. Auth Check
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    // verifyToken is synchronous (no 'await' needed usually, but safe either way)
    const user = verifyToken(token)

    // Check if user exists (Add '&& user.isAdmin' if you have an admin flag)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, message, type } = await request.json()

    // 2. Broadcast (Handles BOTH Firebase & Database now)
    // We don't need to manually insert into DB here anymore because 
    // broadcastNotification() inside lib/notifications.js does it for us.
    await broadcastNotification({ 
      title, 
      message, 
      type 
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Broadcast error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}