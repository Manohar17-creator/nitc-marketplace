'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, CheckCircle, Sparkles } from 'lucide-react'
import { getUserData, getAuthToken, isAuthenticated, setStoredUser } from '@/lib/auth-client'

export default function CompleteProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userData, setUserData] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const user = getUserData()
    if (!user) return

    // ✅ FIX: Only redirect if the phone number is valid and clean
    // This prevents the redirect loop caused by your "9133949468 " entry
    const cleanExistingPhone = user.phone ? user.phone.trim() : ''
    if (cleanExistingPhone.length >= 10) {
      router.push('/')
      return
    }

    setUserData(user)
    setFormData({
      name: user.name || '',
      phone: cleanExistingPhone // Show the trimmed version in the input
    })
  }, [router])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')

    // ✅ DATA CLEANING: Remove spaces and non-digits
    const cleanPhone = formData.phone.replace(/\D/g, '')
    
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      setLoading(false)
      return
    }

    const token = getAuthToken()
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: cleanPhone 
        })
      })

      const data = await res.json()

      if (res.ok) {
        // ✅ SYNC: Update both LocalStorage and Cookies
        setStoredUser(data.user)
        
        // Ensure the cookie used by the middleware/client-lib is updated
        document.cookie = `user_data=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        
        // Short delay to ensure storage is written before redirecting
        setTimeout(() => router.push('/'), 200)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Something went wrong. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          {userData.picture ? (
            <img 
              src={userData.picture} 
              alt="Profile" 
              className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-100 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="text-white" size={40} />
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Profile</h1>
          <p className="text-gray-500 text-sm">Update your details to continue to Unyfy</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">Display Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Phone number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}