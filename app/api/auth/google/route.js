import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const error = searchParams.get('error')
  
  if (error) {
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url))
  }

  // Build Google OAuth URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID)
  googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', 'openid email profile')
  googleAuthUrl.searchParams.set('hd', 'nitc.ac.in') // Restrict to NITC domain
  googleAuthUrl.searchParams.set('prompt', 'select_account')

  return NextResponse.redirect(googleAuthUrl.toString())
}