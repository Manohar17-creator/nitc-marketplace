'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, MapPin, Edit, Trash2, Plus, LogOut, Package } from 'lucide-react'
import Link from 'next/link'
import { getStoredUser } from '@/lib/auth-utils'
import NotificationSettingsButton from '@/components/NotificationSettingsButton'
import NotificationDebugPanel from '@/components/NotificationDebugPanel'

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
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userData =  getStoredUser()
    setUser(userData)
    setEditData({
      name: userData.name || '',
      phone: userData.phone || '',
      location: userData.location || ''
    })

    // Load from cache immediately
    const cachedListings = localStorage.getItem('cached_my_listings')
    if (cachedListings) {
      setMyListings(JSON.parse(cachedListings))
      setLoading(false)
    }

    // Fetch fresh data in background
    loadMyListings()
  }
}, [router])

const loadMyListings = async () => {
  try {
    const token = localStorage.getItem('token')
    const user = getStoredUser()
    
    if (!token || !user.email) {
      setLoading(false)
      return
    }

    const response = await fetch(`/api/listings?userEmail=${user.email}`)
    const data = await response.json()
    
    if (response.ok) {
      const userListings = data.listings.filter(
        listing => listing.sellerEmail === user.email
      )
      setMyListings(userListings)
      // Cache the data
      localStorage.setItem('cached_my_listings', JSON.stringify(userListings))
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

  const handleMarkAsReunited = async (listingId) => {
  const listing = myListings.find(l => l._id === listingId)
  const confirmMessage = listing.lostFoundType === 'lost' 
    ? 'Did you find your lost item?' 
    : 'Was the item claimed by its owner?'
  
  if (!confirm(confirmMessage)) return

  try {
    const token = localStorage.getItem('token')
    
    const response = await fetch(`/api/listings/${listingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'reunited',
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        location: listing.location
      })
    })

    if (response.ok) {
      const successMessage = listing.lostFoundType === 'lost'
        ? 'Great! Glad you found it! 🎉'
        : 'Item successfully returned to owner! 🎉'
      alert(successMessage)
      localStorage.removeItem('cached_my_listings')
      loadMyListings()
    }
  } catch (error) {
    alert('Failed to update')
  }
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
      const updated = myListings.filter(l => l._id !== listingId)
      setMyListings(updated)
      // Update cache
      localStorage.setItem('cached_my_listings', JSON.stringify(updated))
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
      // Clear auth
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Clear all caches
      localStorage.removeItem('cached_subjects')
      localStorage.removeItem('cached_stats')
      localStorage.removeItem('cached_communities')
      localStorage.removeItem('cached_my_community_ids')
      localStorage.removeItem('cached_my_listings')
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

  

  const getLostFoundActionButton = (listing, handleMarkAsSold) => {
  if (listing.category !== 'lost-found') return null;
  
  if (listing.status !== 'active') return null;

  if (listing.type === 'lost') {
    return (
      <button
        onClick={() => handleMarkAsSold(listing._id)}
        className="flex-1 min-w-[80px] px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
      >
        Mark as Found
      </button>
    );
  } else {
    return (
      <button
        onClick={() => handleMarkAsSold(listing._id)}
        className="flex-1 min-w-[80px] px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
      >
        Mark as Claimed
      </button>
    );
  }
};

// Then update the handleMarkAsSold function
const handleMarkAsSold = async (listingId) => {
  const listing = myListings.find(l => l._id === listingId);
  const isLostFound = listing.category === 'lost-found';
  
  const confirmMessage = isLostFound 
    ? (listing.type === 'lost' ? 'Mark this item as found?' : 'Mark this item as claimed?')
    : 'Mark this listing as sold?';

  if (!confirm(confirmMessage)) return;

  try {
    const token = localStorage.getItem('token');
    const newStatus = isLostFound 
      ? (listing.type === 'lost' ? 'found' : 'claimed')
      : 'sold';

    const response = await fetch(`/api/listings/${listingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...listing,
        status: newStatus
      })
    });

    if (response.ok) {
      const successMessage = listing.lostFoundType === 'lost'
        ? 'Great! Glad you found it! 🎉'
        : 'Item successfully returned to owner! 🎉'
      alert(successMessage)
      localStorage.removeItem('cached_my_listings')
      loadMyListings()
    }
  } catch (error) {
    alert('Failed to update listing');
  }
};

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
      <div className="text-center">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-transparent bg-gradient-to-r from-blue-600 to-blue-700 mx-auto mb-4" style={{ borderRadius: '50%' }}></div>
        {/* Optional loading text */}
        <p className="text-blue-600 font-medium">Loading...</p>
      </div>
    </div>
    )
  }

  return (
    <div className="overflow-x-hidden bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
  <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px]">
    <div className="leading-tight">
      <h1 className="text-lg sm:text-xl font-semibold">My Profile</h1>
      <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
        Manage your account and listings
      </p>
    </div>
  </div>
</div>

<main className="pt-[72px] pb-nav-safe  bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 mt-4 mb-4">
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

{/* 2. Notification Settings (NEW) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">App Settings</h3>
          <NotificationSettingsButton userId={user?.id} />
        </div>

<NotificationDebugPanel />

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
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Emoji/Icon */}
        <div className="text-4xl flex-shrink-0 flex justify-center sm:justify-start">
          {getCategoryEmoji(listing.category)}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title + Status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-gray-900 text-lg">{listing.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{listing.description}</p>
            </div>

            <span
              className={`mt-2 sm:mt-0 self-center sm:self-auto px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                listing.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : listing.status === 'reunited'
                  ? 'bg-purple-100 text-purple-700'
                  : listing.status === 'sold'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {listing.status === 'reunited'
                ? listing.lostFoundType === 'lost'
                  ? '✓ Found'
                  : '✓ Claimed'
                : listing.status === 'sold'
                ? 'Sold'
                : 'Active'}
            </span>
          </div>

          {/* Price + Date */}
          <div className="mt-3 text-center sm:text-left">
            <span className="text-xl font-bold text-green-600">
              ₹{listing.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-2 block sm:inline">
              Posted {formatDate(listing.createdAt)}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-4">
            <Link
              href={`/listing/${listing._id}`}
              className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
            >
              View
            </Link>
            <Link
              href={`/edit/${listing._id}`}
              className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
            >
              Edit
            </Link>

            {listing.status === 'active' && (
              <>
                {listing.category === 'lost-found' ? (
                  <button
                    onClick={() => handleMarkAsReunited(listing._id)}
                    className="px-3 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    {listing.lostFoundType === 'lost' ? '✓ Found' : '✓ Claimed'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsSold(listing._id)}
                    className="px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    Sold
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => handleDeleteListing(listing._id)}
              className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
            >
              Delete
            </button>
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
</main>
    </div>
  )
}