import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { verifyToken } from '@/lib/auth'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const decoded = verifyToken(authHeader?.split(' ')[1])
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, category, price } = await request.json()

    const message = {
      notification: {
        title: `📦 New Listing in ${category}`,
        body: `${title} available for ₹${price}. Check it out now!`
      },
      data: {
        url: '/notifications', // Redirects student to their notification inbox
        type: 'new_listing'
      },
      topic: 'all_users' // 🚀 Targeting everyone subscribed
    }

    await admin.messaging().send(message)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Broadcast Error:', error)
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 })
  }
}