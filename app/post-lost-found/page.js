'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ArrowLeft, Loader, Search, MapPin, Calendar, Gift } from 'lucide-react'
import { compressImage } from '@/lib/image-compression'

export default function PostLostFound() {
  const router = useRouter()
  
  // -- State for Form --
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lostFoundType: 'lost',
    reward: '',
    lastSeenLocation: '',
    lastSeenDate: '',
    contactMethod: 'phone',
    images: []
  })
  
  // -- State for Status --
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [imagePreviews, setImagePreviews] = useState([])

  // -- State for Header Search (New) --
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
      setError('Please describe the item')
      setLoading(false)
      return
    }

    if (!formData.lastSeenLocation.trim()) {
      setError('Please provide location where item was lost/found')
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
        body: JSON.stringify({
          ...formData,
          category: 'lost-found',
          price: 0, // Always 0 for lost & found
          location: formData.lastSeenLocation,
          reward: formData.lostFoundType === 'lost' ? Number(formData.reward) || 0 : 0
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`${formData.lostFoundType === 'lost' ? 'Lost' : 'Found'} item posted successfully! 🔍`)
        router.push('/')
      } else {
        setError(data.error || 'Failed to create post')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col">
      
      {/* --- NEW HEADER START --- */}
      {/* Spacer to prevent content from hiding behind fixed header */}

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
      {/* --- NEW HEADER END --- */}


      <div className="max-w-2xl mx-auto p-3 sm:p-4 pb-24 flex-1 w-full">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Lost or Found Toggle */}
          <div className="mb-5">
            <label className="block text-gray-900 font-semibold mb-3 text-sm sm:text-base">
              Type <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, lostFoundType: 'lost' })}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.lostFoundType === 'lost'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                😢 I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, lostFoundType: 'found' })}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.lostFoundType === 'found'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                😊 I Found Something
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">
              What item? <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder={formData.lostFoundType === 'lost' ? 'e.g., Black Wallet, Blue Water Bottle' : 'e.g., Calculator, ID Card'}
              className="w-full px-4 py-3 text-gray-900 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder={
                formData.lostFoundType === 'lost'
                  ? 'Describe the item: color, brand, distinctive features, what was inside, etc.'
                  : 'Describe the item you found: color, condition, where exactly you found it, etc.'
              }
              className="w-full px-4 py-3 text-gray-900 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 Tip: More details help verify ownership
            </p>
          </div>

          {/* Location & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">
                <MapPin size={16} className="inline mr-1" />
                Location <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="lastSeenLocation"
                value={formData.lastSeenLocation}
                onChange={handleChange}
                required
                placeholder="Near Library, Mega Hostel..."
                className="w-full px-4 py-3 text-gray-900 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">
                <Calendar size={16} className="inline mr-1" />
                Date
              </label>
              <input
                type="date"
                name="lastSeenDate"
                value={formData.lastSeenDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 text-gray-900 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Reward (Only for Lost Items) */}
          {formData.lostFoundType === 'lost' && (
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">
                <Gift size={16} className="inline mr-1" />
                Reward (Optional)
              </label>
              <input
                type="number"
                name="reward"
                value={formData.reward}
                onChange={handleChange}
                min="0"
                placeholder="₹500"
                className="w-full px-4 py-3 text-gray-900 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Offering a reward may help recover your item faster
              </p>
            </div>
          )}

          {/* Contact Method */}
          <div className="mb-4">
            <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">
              How should people contact you?
            </label>
            <select
              name="contactMethod"
              value={formData.contactMethod}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-900 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="phone">Phone Only</option>
              <option value="both">Phone & Email</option>
            </select>
          </div>

          {/* Images */}
          <div className="mb-6">
            <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">
              Photos (Max 3) {uploadingImage && <span className="text-indigo-600">- Uploading...</span>}
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
              <label className={`flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors group ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="text-center">
                  {uploadingImage ? (
                    <>
                      <Loader className="mx-auto mb-2 text-indigo-500 animate-spin" size={32} />
                      <span className="text-sm text-indigo-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 text-gray-400 group-hover:text-indigo-500 transition-colors" size={32} />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600">
                        Add photos of the item
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
              📸 Clear photos help identify items quickly
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className={`w-full py-4 rounded-lg font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${
              formData.lostFoundType === 'lost'
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={20} />
                Posting...
              </span>
            ) : (
              formData.lostFoundType === 'lost' ? '📢 Post Lost Item' : '🎉 Post Found Item'
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Your contact info will be visible to help reunite items
          </p>
        </form>
      </div>
    </div>
  )
}