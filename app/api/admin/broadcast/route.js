import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { broadcastNotification } from '@/lib/notifications'

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    const user = await verifyToken(token)

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, message, type } = await request.json()
    await broadcastNotification({ title, message, type })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}