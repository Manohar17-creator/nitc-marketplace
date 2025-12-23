import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // 👈 Try adding this
  maxConnections: 1,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export async function sendPasswordResetEmail(email, resetLink) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset your Unyfy Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Reset Password Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your Unyfy account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This link will expire in <strong>1 hour</strong>.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `
  }

  return transporter.sendMail(mailOptions)
}

export async function sendVerificationEmail(email, verificationLink) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your Unyfy account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Unyfy! 🎉</h2>
        <p>Thank you for signing up. Please verify your email address to start using Unyfy.</p>
        
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