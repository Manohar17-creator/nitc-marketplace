// app/api/auth/send-verification/route.js
import { NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email, userId } = await request.json()

    // ✅ SAFER: Link expires in 1 day (instead of default 30 days)
    const verificationToken = generateToken(userId, '1d')
    
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`

    // Send email using the helper
    await sendVerificationEmail(email, verificationLink)

    return NextResponse.json({ message: 'Verification email sent!' })

  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}