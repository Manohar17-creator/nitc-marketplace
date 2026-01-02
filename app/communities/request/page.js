'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Info, Mail } from 'lucide-react'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function RequestCommunityPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🎯',
    color: '#2563eb' // Default Blue
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 🎭 Expanded Emoji List for Clubs
  const iconOptions = [
    '💻', '🤖', '⚡', '🚀', '🔬', // Tech
    '🎨', '🎭', '🎬', '📸', '✍️', // Arts
    '🎵', '🎸', '🎹', '💃', '🎤', // Music/Dance
    '⚽', '🏏', '🏀', '🏸', '🥋', // Sports
    '♟️', '🎮', '🎲', '🧩', '🎯', // Games
    '🌍', '🌱', '📢', '🤝', '📚'  // Social/Misc
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Please fill all fields')
      setLoading(false)
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/communities/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Request submitted! ✅')
        router.push('/communities')
      } else {
        setError(data.error || 'Failed to submit request')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe">
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
        <div className="max-w-4xl mx-auto px-4 h-[64px] sm:h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-1 hover:bg-blue-700 rounded-full transition-colors active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Request Community
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[80px] pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Community Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Robotics Club"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this club about?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  required
                />
              </div>

              {/* Icons Grid */}
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Choose Icon</label>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 h-48 overflow-y-auto">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        formData.icon === icon
                          ? 'bg-blue-100 ring-2 ring-blue-600 scale-110'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>

            {/* 👇 Updated Contact Info Block */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-1">Approval Process</p>
                <p className="mb-2 leading-relaxed">
                  Community requests are reviewed by an admin within <span className="font-semibold text-blue-700">24 hours</span>.
                </p>
                <p className="leading-relaxed">
                  For urgent approval or specific details, please email us at{' '}
                  <a 
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=support@unyfy.in" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    support@unyfy.in <Mail size={12} />
                  </a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}