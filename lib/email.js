import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export async function sendVerificationEmail(email, verificationLink) {
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
      </div>
    `
  }

  return transporter.sendMail(mailOptions)
}