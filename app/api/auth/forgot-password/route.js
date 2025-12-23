import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { generateToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email } = await request.json()

    const client = await clientPromise
    const db = client.db('nitc-marketplace')

    // 1. Check if user exists
    const user = await db.collection('users').findOne({ email })

    // Security Note: Even if user is NOT found, we return 200 OK.
    // This prevents hackers from checking which emails are registered ("Email Enumeration").
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, email sent.' })
    }

    // 2. Generate a short-lived token (1 Hour)
    // We use the same generateToken helper but with a shorter expiry
    const resetToken = generateToken(user._id, '1h')
    
    // 3. Create the Link (Points to your Reset Page)
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`

    // 4. Send Email
    await sendPasswordResetEmail(user.email, resetLink)

    return NextResponse.json({ message: 'Email sent successfully' })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}