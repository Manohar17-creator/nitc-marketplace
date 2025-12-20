'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, AlignLeft, Image as ImageIcon, Type } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

  // Redirect if not logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
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

    const token = localStorage.getItem('token')
    
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
        alert('Event created successfully! 🎉')
        
        // ✅ FIX: Force the Events page to reload data from the server
        router.refresh() 
        
        // Then navigate
        router.push('/events')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create event')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- Header (Matches PostListing) --- */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => router.back()}
                className="p-2 -ml-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
                <ArrowLeft size={22} />
            </button>
            <div>
                <h1 className="text-2xl font-bold">Post New Event</h1>
                <p className="text-blue-100 text-sm">Share an upcoming event</p>
            </div>
          </div>
        </div>
      </div>

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
            {loading ? 'Posting...' : 'Post Event'}
          </button>
          
        </form>
      </div>
    </div>
  )
}