'use client'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Calendar, MapPin, AlignLeft, Image as ImageIcon, Type, CheckCircle, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function CreateEvent() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    eventDate: '',
    image: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setImageFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData({ ...formData, image: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return null

    setUploadingImage(true)
    const uploadFormData = new FormData()
    uploadFormData.append('file', imageFile)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (!res.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await res.json()
      return data.url
    } catch (err) {
      console.error('Image upload error:', err)
      throw new Error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
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
      // Upload image to Cloudinary if selected
      let imageUrl = ''
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary()
      }

      // Submit event with Cloudinary URL
      const eventData = {
        ...formData,
        image: imageUrl
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(eventData)
      })

      if (res.ok) {
        setSuccess(true)
        
        setTimeout(() => {
          router.push('/events')
          router.refresh()
        }, 500)
        
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create event')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
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
      
      {/* Spacer */}
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

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base flex items-center gap-2">
              <ImageIcon size={16} className="text-blue-500" /> Event Image (Optional)
            </label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload" 
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Click to upload an image
                  </span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG, WebP (max 5MB)
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {loading || uploadingImage ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {uploadingImage ? 'Uploading Image...' : 'Creating Event...'}
              </span>
            ) : 'Post Event'}
          </button>
          
        </form>
      </div>
    </div>
  )
}