import { NextResponse } from 'next/server'

// Fake signup (no database for now)
export async function POST(request) {
  try {
    const { name, email, phone, password } = await request.json()

    // Validate NITC email
    if (!email.endsWith('@nitc.ac.in')) {
      return NextResponse.json(
        { error: 'Please use your NITC email (@nitc.ac.in)' },
        { status: 400 }
      )
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // In real version, this would save to database
    // For now, just return success
    const fakeToken = 'fake-jwt-token-' + Date.now()

    return NextResponse.json({
      message: 'Account created successfully!',
      token: fakeToken,
      user: { name, email, phone }
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}