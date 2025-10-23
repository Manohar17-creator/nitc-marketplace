'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Users } from 'lucide-react'
import Link from 'next/link'

export default function RequestCommunityPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🎯',
    color: '#3b82f6'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const iconOptions = ['🎯', '🎨', '💻', '📸', '🎵', '⚽', '🎮', '📚', '🎭', '🔬', '🎪', '🎬', '✍️', '🎤', '🏃']
  const colorOptions = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6']

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
      const token = localStorage.getItem('token')
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
        alert('Community request submitted! ✅\nYou will be notified once approved.')
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg safe-top">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/communities"
            className="flex items-center gap-2 mb-3 hover:opacity-80 active:scale-95 transition"
          >
            <ChevronLeft size={22} />
            <span className="text-sm">Back</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Users size={28} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Request Community</h1>
              <p className="text-green-100 text-xs sm:text-sm">
                Create a new community for students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Community Name */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2">
                Community Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Video Editing Club"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this community is about..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2">
                Choose Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`text-3xl p-3 rounded-lg transition-all ${
                      formData.icon === icon
                        ? 'bg-green-100 ring-2 ring-green-600 scale-110'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-gray-900 font-semibold mb-2">
                Choose Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-12 rounded-lg transition-all ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="flex items-center gap-3">
                <div 
                  className="text-3xl w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {formData.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{formData.name || 'Community Name'}</p>
                  <p className="text-sm text-gray-600">{formData.description || 'Description...'}</p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ Your request will be reviewed by admin. You will be notified once approved.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}