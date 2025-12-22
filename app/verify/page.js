'use client'
import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader, Home } from 'lucide-react'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('verifying') 
  const hasVerified = useRef(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        return
      }

      if (hasVerified.current) return
      hasVerified.current = true 

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          
          // 🚀 AUTO-LOGIN LOGIC
          // If your backend returns a token, save it and go Home
          if (data.token) {
             localStorage.setItem('token', data.token)
             localStorage.setItem('user', JSON.stringify(data.user))
             
             // Faster redirect (1.5s) so they don't wait too long
             setTimeout(() => router.push('/'), 1500)
          } else {
             // Fallback: If backend didn't send token, we MUST go to login
             setTimeout(() => router.push('/login'), 2000)
          }

        } else {
          // Handle "Already Verified" case
          if (data.message === 'Email already verified') {
             setStatus('success')
             setTimeout(() => router.push('/login'), 2000)
          } else {
             setStatus('error')
          }
        }
      } catch (error) {
        setStatus('error')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={50} />
            <h1 className="text-xl font-bold text-gray-900">Verifying your email...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-4 text-green-500" size={60} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verified! 🎉</h1>
            <p className="text-gray-600 mb-6">
               Welcome to Unyfy. Taking you to the app...
            </p>
            {/* Visual Indicator of redirection */}
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-[progress_1.5s_ease-in-out]"></div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 text-red-500" size={60} />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-sm mb-6">The link is invalid or expired.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
      
      {/* Animation for the progress bar */}
      <style jsx global>{`
        @keyframes progress {
          0% { width: 0% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="h-screen bg-white" />}>
      <VerifyEmailContent />
    </Suspense>
  )
}