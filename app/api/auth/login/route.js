import { NextResponse } from 'next/server'

// Fake login (no database for now)
export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // For testing, accept any @nitc.ac.in email with any password
    if (!email.endsWith('@nitc.ac.in')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return fake success
    const fakeToken = 'fake-jwt-token-' + Date.now()

    return NextResponse.json({
      message: 'Login successful',
      token: fakeToken,
      user: {
        name: 'Test User',
        email: email,
        phone: '+91 98765 43210'
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}