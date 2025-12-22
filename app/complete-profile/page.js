'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, CheckCircle } from 'lucide-react'

export default function CompleteProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })

  // 1. Load existing data (Pre-fill Name if available)
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userStr)
      setFormData(prev => ({
        ...prev,
        name: user.name || '',  // Pre-fill name from Google
        phone: user.phone || '' 
      }))
    } catch (e) {
      router.push('/login')
    }
  }, [router])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const token = localStorage.getItem('token')

    try {
      // Sends data to your backend to update the user
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
        // Update local storage with the new full profile
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Success! Go to Home Page
        router.push('/')
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">One Last Step!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Confirm your details so people can contact you.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 1. Name Input */}
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-1.5 uppercase tracking-wide">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                placeholder="Your Name"
              />
            </div>
          </div>

          {/* 2. Phone Input */}
          <div>
            <label className="block text-gray-700 text-xs font-bold mb-1.5 uppercase tracking-wide">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all"
                placeholder="+91 98765 43210"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 ml-1">
              Used for buyers/sellers to call or WhatsApp you.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-lg font-bold hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? 'Saving...' : 'Get Started 🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}