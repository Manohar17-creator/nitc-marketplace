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
    // ✅ SIMPLIFIED: Use utility functions
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const user = getUserData()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUserData(user)
    setFormData({
      name: user.name || '',
      phone: user.phone || ''
    })

    // If user already has phone, redirect to home
    if (user.phone) {
      router.push('/')
    }
  }, [router])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }

    // ✅ SIMPLIFIED: Use utility function
    const token = getAuthToken()

    if (!token) {
      setError('Authentication token not found. Please login again.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        // ✅ SIMPLIFIED: Use utility function
        setStoredUser(data.user)
        
        // Also update cookie for consistency
        document.cookie = `user_data=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${60 * 60 * 24 * 7}`
        
        router.push('/')
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Profile update error:', err)
      setError('Something went wrong. Please try again.')
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Almost There!</h1>
          <p className="text-gray-500 text-sm">
            Complete your profile to start using Unyfy
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-6">
          
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all outline-none text-base"
                placeholder="Your display name"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              This is how others will see you on Unyfy
            </p>
          </div>

          <div>
            <label className="block text-gray-700 text-xs font-bold mb-2 uppercase tracking-wide">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10,12}"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all outline-none text-base"
                placeholder="9876543210"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              For buyers/sellers to contact you (WhatsApp/Call)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Your NITC Email</p>
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              {userData.email}
              <CheckCircle size={16} className="text-green-500" />
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-base hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Complete Setup <Sparkles size={20} />
              </span>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            🔒 Your contact info is only visible to verified NITC members
          </p>
        </div>
      </div>
    </div>
  )
}