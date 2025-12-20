'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthComplete() {
  const router = useRouter()

  useEffect(() => {
    const token = getCookie('auth_token')
    const userData = getCookie('user_data')

    if (token && userData) {
      try {
        // ✅ FIX: Store as plain JSON, not URL-encoded
        localStorage.setItem('token', token)
        localStorage.setItem('user', userData) // Already a JSON string from cookie
        
        // Clear cookies
        document.cookie = 'auth_token=; Max-Age=0; path=/;'
        document.cookie = 'user_data=; Max-Age=0; path=/;'
        
        console.log('✅ Authentication completed')
        
        router.push('/')
      } catch (error) {
        console.error('❌ Auth completion failed:', error)
        router.push('/login?error=auth_failed')
      }
    } else {
      console.error('❌ No auth data found')
      router.push('/login?error=auth_failed')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
        <p className="text-xl font-semibold">Completing sign in...</p>
        <p className="text-blue-100 text-sm mt-2">Please wait</p>
      </div>
    </div>
  )
}

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}