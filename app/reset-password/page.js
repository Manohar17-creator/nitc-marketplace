'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('idle') // idle, success, error
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')

    if (passwords.newPassword !== passwords.confirmPassword) {
      setStatus('error')
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    if (passwords.newPassword.length < 6) {
      setStatus('error')
      setMessage('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPassword: passwords.newPassword 
        })
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage('Password reset successfully! Redirecting to login...')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Link expired or invalid')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Invalid Link</h1>
          <p className="text-gray-500 mt-2">This password reset link is missing or broken.</p>
          <button onClick={() => router.push('/login')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg">Go to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">New Password</h1>
          <p className="text-gray-500 mt-2 text-sm">Create a strong password for your account.</p>
        </div>

        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {message}
          </div>
        )}

        {status === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">All Done!</h3>
            <p className="text-gray-500 mt-2">Your password has been updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-xs font-bold mb-1 uppercase">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-70"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-blue-600"/></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}