'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ArrowLeft } from 'lucide-react'

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
  const [error, setError] = useState('')
  const [imagePreviews, setImagePreviews] = useState([])

  // Check if user is logged in
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
    { id: 'misc', name: 'Miscellaneous' }
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + imagePreviews.length > 3) {
      setError('Maximum 3 images allowed')
      return
    }

    setError('')

    // Create preview URLs
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      file: file
    }))

    setImagePreviews([...imagePreviews, ...newPreviews])
  }

  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImagePreviews(newPreviews)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
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

      // In real app, you'd upload images to Cloudinary here
      // For now, we'll just send the data without images
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: [] // Will add image upload later
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Show success and redirect
        alert('Listing posted successfully!')
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 hover:opacity-80"
          >
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold">Post New Listing</h1>
          <p className="text-blue-100 text-sm">Fill in the details below</p>
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
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., iPhone 12 - 128GB, Data Structures Book"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe your item in detail... (condition, age, features, etc.)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length} characters
            </p>
          </div>

          {/* Price & Category Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Mega Hostel, Near Main Gate, PG Near Campus"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Help buyers find you easily
            </p>
          </div>

          {/* Images */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Images (Optional - Max 3)
            </label>
            
            {/* Image Preview */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-28 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {imagePreviews.length < 3 && (
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" size={32} />
                  <span className="text-sm text-gray-600 group-hover:text-blue-600">
                    Click to upload images
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 5MB each
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}

            <p className="mt-2 text-xs text-gray-500">
              💡 Tip: Add clear photos to get more responses!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Posting...
              </span>
            ) : (
              'Post Listing'
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Your contact info will be visible to interested buyers
          </p>
        </form>
      </div>
    </div>
  )
}