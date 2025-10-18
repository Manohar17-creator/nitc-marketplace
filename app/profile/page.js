'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, MapPin, Edit, Trash2, Plus, LogOut, Package } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [myListings, setMyListings] = useState([])
  const [activeTab, setActiveTab] = useState('listings')
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    location: ''
  })

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setUser(userData)
      setEditData({
        name: userData.name || '',
        phone: userData.phone || '',
        location: userData.location || ''
      })

      // Load user's listings
      loadMyListings()
    }
  }, [router])

  const loadMyListings = async () => {
    try {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        
        if (!token || !user.email) {
        setLoading(false)
        return
        }

        // Fetch listings by user email (since we're storing sellerEmail)
        const response = await fetch(`/api/listings?userEmail=${user.email}`)
        const data = await response.json()
        
        if (response.ok) {
        // Filter listings by current user's email
        const userListings = data.listings.filter(
            listing => listing.sellerEmail === user.email
        )
        setMyListings(userListings)
        }
    } catch (error) {
        console.error('Error loading listings:', error)
    } finally {
        setLoading(false)
    }
    }

  const handleEditProfile = () => {
    setEditMode(true)
  }

  const handleSaveProfile = () => {
    // Save updated profile
    if (typeof window !== 'undefined') {
      const updatedUser = {
        ...user,
        ...editData
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setEditMode(false)
      alert('Profile updated successfully!')
    }
  }

  const handleCancelEdit = () => {
    setEditData({
      name: user.name || '',
      phone: user.phone || '',
      location: user.location || ''
    })
    setEditMode(false)
  }

    const handleMarkAsSold = async (listingId) => {
    if (!confirm('Mark this listing as sold?')) return

    try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            status: 'sold',
            title: myListings.find(l => l._id === listingId)?.title,
            description: myListings.find(l => l._id === listingId)?.description,
            price: myListings.find(l => l._id === listingId)?.price,
            category: myListings.find(l => l._id === listingId)?.category,
            location: myListings.find(l => l._id === listingId)?.location
        })
        })

        if (response.ok) {
        alert('Marked as sold! ✅')
        loadMyListings() // Reload listings
        }
    } catch (error) {
        alert('Failed to update listing')
    }
    }

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Remove from local state
        setMyListings(myListings.filter(l => l._id !== listingId))
        alert('Listing deleted successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete listing')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete listing')
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      router.push('/login')
    }
  }

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      books: '📚',
      electronics: '💻',
      tickets: '🎫',
      rides: '🚗',
      housing: '🏠',
      events: '🎉',
      misc: '🎁'
    }
    return emojiMap[category] || '📦'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">My Profile</h1>
              <p className="text-blue-100 text-sm">Manage your account and listings</p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
        {user.name?.charAt(0).toUpperCase() || 'U'}
      </div>
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{user.name}</h2>
        <p className="text-gray-600 text-sm sm:text-base truncate">{user.email}</p>
      </div>
    </div>
    <button
      onClick={handleLogout}
      className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95 w-full sm:w-auto"
    >
      <LogOut size={18} />
      <span>Logout</span>
    </button>
  </div>
</div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'listings'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package size={20} />
                <span>My Listings ({myListings.length})</span>
              </div>
            </button>
          </div>

          {/* My Listings */}
          <div className="p-6">
            {myListings.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">You have not posted any listings yet</p>
                <Link
                  href="/post"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  <span>Post Your First Listing</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myListings.map(listing => (
                  <div
                    key={listing._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className="text-4xl flex-shrink-0">
                        {getCategoryEmoji(listing.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {listing.title}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {listing.description}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            listing.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            <span className="text-xl font-bold text-green-600">
                              ₹{listing.price.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500 ml-3">
                              Posted {formatDate(listing.createdAt)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Link
                                href={`/listing/${listing._id}`}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                            >
                                View
                            </Link>
                            <Link
                                href={`/edit/${listing._id}`}
                                className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
                            >
                                Edit
                            </Link>

                            {/* Add Mark Sold button here */}
                            {listing.status === 'active' && (
                              <button
                              onClick={() => handleMarkAsSold(listing._id)}
                              className="flex-1 min-w-[80px] px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-sm font-medium"
                            >
                              Mark Sold
                            </button>
                            )}

                            <button
                              onClick={() => handleDeleteListing(listing._id)}
                              className="flex-1 min-w-[70px] px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                            >
                              Delete
                            </button>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
  <Link
    href="/post"
    className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm sm:text-base active:scale-95"
  >
    <Plus size={20} />
    <span>Post New Listing</span>
  </Link>
  <Link
    href="/"
    className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base active:scale-95"
  >
    <Package size={20} />
    <span>Browse Listings</span>
  </Link>
</div>
      </div>
    </div>
  )
}{myListings.map(listing => (
  <div
    key={listing._id}
    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
  >
    <div className="flex gap-4">
      <div className="text-4xl flex-shrink-0">
        {getCategoryEmoji(listing.category)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
              {listing.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {listing.description}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            listing.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {listing.status}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-green-600">
              ₹{listing.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(listing.createdAt)}
            </span>
          </div>
          
          {/* Buttons - Stay in one row, scroll if needed */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Link
              href={`/listing/${listing._id}`}
              className="flex-shrink-0 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
            >
              View
            </Link>
            <Link
              href={`/edit/${listing._id}`}
              className="flex-shrink-0 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
            >
              Edit
            </Link>
            {listing.status === 'active' && (
              <button
                onClick={() => handleMarkAsSold(listing._id)}
                className="flex-shrink-0 px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
              >
                Mark Sold
              </button>
            )}
            <button
              onClick={() => handleDeleteListing(listing._id)}
              className="flex-shrink-0 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
))}