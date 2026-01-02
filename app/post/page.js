'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ArrowLeft, Loader } from 'lucide-react'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'
import { compressImage } from '@/lib/image-compression' // ✅ Use your library

export default function PostListing() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'books',
    location: '',
    images: []
  })
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [imagePreviews, setImagePreviews] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
      }
    }
  }, [router])

  const categories = [
    { id: 'books', name: 'Books & Notes' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'tickets', name: 'Travel Tickets' },
    { id: 'rides', name: 'Ride Sharing' },
    { id: 'housing', name: 'PG/Rooms' },
    { id: 'events', name: 'Event Tickets' },
    { id: 'misc', name: 'Miscellaneous' },
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length + imagePreviews.length > 3) {
      setError('Maximum 3 images allowed')
      return
    }

    if (files.length === 0) return

    setError('')
    setUploadingImage(true)

    try {
      const uploadPromises = files.map(async (file) => {
        // Basic validation
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB')
        }

        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed')
        }

        // ✅ COMPRESS IMAGE using your lib/image-compression
        console.log('📦 Compressing image...')
        const compressedFile = await compressImage(file)
        
        // ✅ FIX: Named variable 'uploadData' to avoid conflict with 'formData' state
        const uploadData = new FormData()
        uploadData.append('file', compressedFile)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        })

        if (response.ok) {
    alert('Listing posted successfully! 🎉');
    router.push('/');
} else {
    // This will now show "Please wait 60s" instead of "Something went wrong"
    setError(data.error || 'Failed to create listing');
}

        const resData = await response.json()
        return {
          url: resData.url,
          preview: resData.url
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)
      
      // Use functional updates to ensure state consistency
      setImagePreviews(prev => [...prev, ...uploadedImages])
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages.map(img => img.url)]
      }))

    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload images')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    const newImages = formData.images.filter((_, i) => i !== index)
    
    setImagePreviews(newPreviews)
    setFormData({ ...formData, images: newImages })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic Validation
    if (!formData.title.trim() || !formData.description.trim() || !formData.price) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const token = getAuthToken()
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Listing posted successfully! 🎉')
        router.push('/')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create listing')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-lg sm:text-xl font-bold leading-tight">Post New Listing</h1>
                <p className="text-blue-100 text-xs sm:text-sm leading-none mt-0.5">Fill in the details below</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[64px] sm:h-[72px]" />

      <div className="max-w-2xl mx-auto p-4 pb-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Engineering Mathematics Textbook"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Description <span className="text-red-500">*</span></label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Detailed description of the item..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Price (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Category <span className="text-red-500">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Images (Max 3)</label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img src={preview.preview} className="w-full h-28 object-cover rounded-lg border" alt="upload preview" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14} /></button>
                </div>
              ))}
            </div>
            {imagePreviews.length < 3 && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="text-gray-400 mb-1" />
                <span className="text-sm text-gray-500">{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}