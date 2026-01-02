'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader } from 'lucide-react'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function EditListing({ params }) {
  const router = useRouter()
  const [listingId, setListingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'books',
    location: '',
    status: 'active'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    { id: 'lost-found', name: 'Lost & Found' },
    { id: 'books', name: 'Books & Notes' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'tickets', name: 'Travel Tickets' },
    { id: 'rides', name: 'Ride Sharing' },
    { id: 'housing', name: 'PG/Rooms' },
    { id: 'events', name: 'Event Tickets' },
    { id: 'misc', name: 'Miscellaneous' }
  ]

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const resolvedParams = await params
        const id = resolvedParams.id
        setListingId(id)

        const response = await fetch(`/api/listings/${id}`)
        const data = await response.json()

        if (response.ok) {
          setFormData({
            title: data.listing.title,
            description: data.listing.description,
            price: data.listing.price,
            category: data.listing.category,
            location: data.listing.location || '',
            status: data.listing.status
          })
        } else {
          setError('Listing not found')
        }
      } catch (err) {
        setError('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [params])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Listing updated successfully! ✅')
        router.push('/profile')
      } else {
        setError(data.error || 'Failed to update listing')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 hover:opacity-80"
          >
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold">Edit Listing</h1>
          <p className="text-blue-100 text-sm">Update your listing details</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 resize-none"
            />
          </div>

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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
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

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="active">Active (Visible to buyers)</option>
              <option value="sold">Sold (Hidden from listings)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Mark as &quot;Sold&quot; to hide from public listings
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="animate-spin" size={20} />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
                onClick={() => handleMarkAsSold(listing._id)}
                className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium"
                >
                Mark Sold
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}