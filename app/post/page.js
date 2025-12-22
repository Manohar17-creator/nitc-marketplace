'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ArrowLeft, Loader } from 'lucide-react'

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
      const token = localStorage.getItem('token')
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
      // Validate file size BEFORE compression (max 10MB raw)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed')
      }

      // ✅ COMPRESS IMAGE FIRST
      console.log('📦 Compressing image...')
      const compressedFile = await compressImage(file)
      
      // Create form data with compressed image
      const formData = new FormData()
      formData.append('file', compressedFile)

      // Upload to your API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      return {
        url: data.url,
        preview: data.url
      }
    })

    const uploadedImages = await Promise.all(uploadPromises)
    
    setImagePreviews([...imagePreviews, ...uploadedImages])
    setFormData({
      ...formData,
      images: [...formData.images, ...uploadedImages.map(img => img.url)]
    })

    console.log('✅ All images uploaded successfully!')

  } catch (err) {
    console.error('Upload error:', err)
    setError(err.message || 'Failed to upload images')
  } finally {
    setUploadingImage(false)
  }
}

// Keep removeImage function as is
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

    if (!formData.title.trim()) {
      setError('Please enter a title')
      setLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError('Please enter a description')
      setLoading(false)
      return
    }

    if (!formData.price || formData.price <= 0) {
      setError('Please enter a valid price')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Listing posted successfully! 🎉')
        router.push('/')
      } else {
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


      <div className="max-w-2xl mx-auto p-4 pb-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* All inputs - Better mobile sizing */}
    <div className="mb-3 sm:mb-4">
      <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
        Title <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        required
        placeholder="e.g., iPhone 12 - 128GB"
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  placeholder-gray-400"
      />
    </div>

          {/* Description - Mobile friendly */}
    <div className="mb-3 sm:mb-4">
      <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
        Description <span className="text-red-500">*</span>
      </label>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        required
        rows={4}
        placeholder="Describe your item..."
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400  resize-none"
      />
    </div>

          {/* Price & Category - Stack on mobile */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
      <div>
        <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
          Price (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
          min="0"
          placeholder="1000"
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  placeholder-gray-400"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Mega Hostel, Near Main Gate"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  placeholder-gray-400"
            />
          </div>

          {/* Images Section - UPDATED WITH REAL UPLOAD */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Images (Max 3) {uploadingImage && <span className="text-blue-600">- Uploading...</span>}
            </label>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-28 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={uploadingImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length < 3 && (
              <label className={`flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors group ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="text-center">
                  {uploadingImage ? (
                    <>
                      <Loader className="mx-auto mb-2 text-blue-500 animate-spin" size={32} />
                      <span className="text-sm text-blue-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" size={32} />
                      <span className="text-sm text-gray-600 group-hover:text-blue-600">
                        Click to upload images
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG up to 5MB each
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            )}

            <p className="mt-2 text-xs text-gray-500">
              📸 Images are uploaded to Cloudinary and optimized automatically
            </p>
          </div>

          <button
      type="submit"
      disabled={loading || uploadingImage}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]"
    >
      {loading ? 'Posting...' : 'Post Listing'}
    </button>
        </form>
      </div>
    </div>
  )
}
