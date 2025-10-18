import { NextResponse } from 'next/server'

export function middleware(request) {
  // Get user from headers (you'd need to verify token properly)
  const pathname = request.nextUrl.pathname

  // Protected routes
  const protectedRoutes = ['/post', '/profile', '/edit']
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // In a real app, verify JWT token here
    // For now, just let it through and check on client side
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/post/:path*', '/profile/:path*', '/edit/:path*']
}