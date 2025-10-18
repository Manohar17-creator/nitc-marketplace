import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, userId } = await request.json()

    // Generate verification token
    const verificationToken = generateToken(userId)
    const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}`

    // Create transporter (using Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail
        pass: process.env.EMAIL_PASS  // App-specific password
      }
    })

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your NITC Marketplace account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to NITC Marketplace! 🎉</h2>
          <p>Thank you for signing up. Please verify your email address to start buying and selling on campus.</p>
          
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Verify Email
          </a>
          
          <p style="color: #666; font-size: 14px;">
            Or copy this link: <br>
            <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${verificationLink}</code>
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            If you didn't sign up for NITC Marketplace, please ignore this email.
          </p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ message: 'Verification email sent!' })

  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    )
  }
}