'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, MapPin, AlignLeft, Image as ImageIcon, Type, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function CreateEvent() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    eventDate: '',
    image: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
      }
    }
  }, [router])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.title.trim()) {
      setError('Please enter a title')
      setLoading(false)
      return
    }

    if (!formData.eventDate) {
      setError('Please select a date and time')
      setLoading(false)
      return
    }

    const token = getAuthToken()
    
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        // Show success message
        setSuccess(true)
        
        // Navigate immediately - don't wait for refresh
        setTimeout(() => {
          router.push('/events')
          // Force refresh after navigation
          router.refresh()
        }, 500)
        
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create event')
        setLoading(false)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Success overlay
  if (success) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <CheckCircle size={80} className="mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2">Event Created! 🎉</h2>
          <p className="text-green-100">Redirecting to events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-50 shadow-lg safe-top">
        <div className="max-w-2xl mx-auto h-[64px] sm:h-[72px] flex items-center px-4">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => router.back()}
                className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 active:scale-95"
            >
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-lg sm:text-xl font-bold leading-tight">Post New Event</h1>
                <p className="text-blue-100 text-xs sm:text-sm leading-none mt-0.5">Share an upcoming event</p>
            </div>
          </div>
        </div>
      </div>
      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-[64px] sm:h-[72px]" />
      <div className="max-w-2xl mx-auto p-4 pb-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
              <Type size={16} className="text-blue-500" /> Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Ex: Football Match"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

          {/* Date & Time */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" /> Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 bg-white"
            />
          </div>

          {/* Venue */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
              <MapPin size={16} className="text-blue-500" /> Venue <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
              placeholder="Ex: Main Ground"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

          {/* Description */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
              <AlignLeft size={16} className="text-blue-500" /> Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Details about the event..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 resize-none"
            />
          </div>

          {/* Image URL (Optional) */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
              <ImageIcon size={16} className="text-blue-500" /> Image URL (Optional)
            </label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/poster.jpg"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
            <p className="mt-2 text-xs text-gray-500">
              Paste a direct link to an image (e.g., from Google Drive or Imgur).
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Event...
              </span>
            ) : 'Post Event'}
          </button>
          
        </form>
      </div>
    </div>
  )
}