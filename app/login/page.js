'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Handle Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')

    if (urlError) {
      const errorMessages = {
        'google_auth_failed': 'Google login failed. Please try again.',
        'invalid_domain': 'Please use your NITC email (@nitc.ac.in)',
        'no_code': 'Authorization failed. Please try again.',
        'token_failed': 'Failed to get access token. Please try again.',
        'auth_failed': 'Authentication failed. Please try again.'
      }
      setError(errorMessages[urlError] || 'Login failed. Please try again.')
    }
  }, [router])

  const handleGoogleLogin = () => {
    // Clear any stale auth data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* Logo & Tagline */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600 tracking-tight mb-2">Unyfy</h1>
        <p className="text-gray-600 text-lg font-medium">Where campus comes together</p>
        
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-gray-200">

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
          <p className="text-gray-500 text-sm">Sign in with your NITC Google account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 flex items-center gap-2">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button 
          type="button" 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            className="w-6 h-6" 
            alt="Google" 
          />
          <span className="text-base">Continue with Google</span>
        </button>

        {/* Info Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Only <span className="font-semibold text-gray-600">@nitc.ac.in</span> emails are allowed
          </p>
        </div>



      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  )
}