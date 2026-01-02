'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ArrowLeft, Loader, MapPin, Calendar, Gift } from 'lucide-react'
import { compressImage } from '@/lib/image-compression' // ✅ Use centralized lib
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function PostLostFound() {
  const router = useRouter()
  
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
        if (file.size > 10 * 1024 * 1024) throw new Error('File size must be less than 10MB')
        if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed')

        // ✅ COMPRESS IMAGE using lib
        console.log('📦 Compressing image...')
        const compressedFile = await compressImage(file)
        
        // ✅ FIX: Rename 'formData' to 'uploadData' to avoid state conflict
        const uploadData = new FormData()
        uploadData.append('file', compressedFile)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        })

        if (!response.ok) {
          const errorMsg = await response.json()
          throw new Error(errorMsg.error || 'Upload failed')
        }

        const resData = await response.json()
        return {
          url: resData.url,
          preview: resData.url
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)
      
      // Use functional updates for state consistency
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

    if (!formData.title.trim() || !formData.description.trim() || !formData.lastSeenLocation.trim()) {
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
        body: JSON.stringify({
          ...formData,
          category: 'lost-found',
          price: 0,
          location: formData.lastSeenLocation,
          reward: formData.lostFoundType === 'lost' ? Number(formData.reward) || 0 : 0
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`${formData.lostFoundType === 'lost' ? 'Lost' : 'Found'} item posted! 🔍`)
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-50 shadow-lg safe-top">
        <div className="max-w-2xl mx-auto h-[64px] sm:h-[72px] flex items-center px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors active:scale-95">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-lg sm:text-xl font-bold leading-tight">Post Lost & Found</h1>
                <p className="text-blue-100 text-xs sm:text-sm leading-none mt-0.5">Help reunite items with owners</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[64px] sm:h-[72px]" />

      <div className="max-w-2xl mx-auto p-3 sm:p-4 pb-24 flex-1 w-full">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="mb-5">
            <label className="block text-gray-900 font-semibold mb-3">Type <span className="text-red-600">*</span></label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, lostFoundType: 'lost' })}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${formData.lostFoundType === 'lost' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
              >
                😢 Lost Item
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, lostFoundType: 'found' })}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${formData.lostFoundType === 'found' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
              >
                😊 Found Item
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 font-semibold mb-2">Item Name <span className="text-red-600">*</span></label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Black Wallet, ID Card" />
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 font-semibold mb-2">Description <span className="text-red-600">*</span></label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Distinctive features, brand, etc." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-900 font-semibold mb-2"><MapPin size={16} className="inline mr-1" />Location <span className="text-red-600">*</span></label>
              <input type="text" name="lastSeenLocation" value={formData.lastSeenLocation} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Near Library, Hostel..." />
            </div>
            <div>
              <label className="block text-gray-900 font-semibold mb-2"><Calendar size={16} className="inline mr-1" />Date</label>
              <input type="date" name="lastSeenDate" value={formData.lastSeenDate} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {formData.lostFoundType === 'lost' && (
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2"><Gift size={16} className="inline mr-1" />Reward (Optional)</label>
              <input type="number" name="reward" value={formData.reward} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="₹ Amount" />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-900 font-semibold mb-2">Photos (Max 3)</label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {imagePreviews.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p.preview} className="w-full h-28 object-cover rounded-lg border" alt="preview" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14} /></button>
                </div>
              ))}
            </div>
            {imagePreviews.length < 3 && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="text-gray-400 mb-1" />
                <span className="text-sm text-gray-500">{uploadingImage ? 'Uploading...' : 'Add Photo'}</span>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className={`w-full py-4 rounded-lg font-bold text-white shadow-lg active:scale-[0.98] transition-all ${formData.lostFoundType === 'lost' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
          >
            {loading ? 'Posting...' : (formData.lostFoundType === 'lost' ? '📢 Post Lost Item' : '🎉 Post Found Item')}
          </button>
        </form>
      </div>
    </div>
  )
}