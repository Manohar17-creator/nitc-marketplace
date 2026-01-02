'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Mail, Phone, MapPin, Edit, Trash2, Plus, 
  LogOut, Package, MessageSquare, ChevronRight, Camera, X, Loader2 
} from 'lucide-react'
import Link from 'next/link'
import { getUserData, getAuthToken, logout } from '@/lib/auth-client'
import NotificationSettingsButton from '@/components/NotificationSettingsButton'

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  
  // State Management
  const [user, setUser] = useState(null)
  const [myListings, setMyListings] = useState([])
  const [activeTab, setActiveTab] = useState('listings')
  const [loading, setLoading] = useState(true)
  
  // Profile Edit State
  const [editMode, setEditMode] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    picture: ''
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const userData = getUserData()
      setUser(userData)
      setEditData({
        name: userData.name || '',
        phone: userData.phone || '',
        picture: userData.picture || ''
      })

      const cachedListings = localStorage.getItem('cached_my_listings')
      if (cachedListings) {
        setMyListings(JSON.parse(cachedListings))
        setLoading(false)
      }
      loadMyListings()
    }
  }, [router])

  const loadMyListings = async () => {
    try {
      const token = getAuthToken()
      const userData = getUserData()
      if (!token || !userData.email) return

      const response = await fetch(`/api/listings?userEmail=${userData.email}`)
      const data = await response.json()

      if (response.ok) {
        const userListings = data.listings.filter(l => l.sellerEmail === userData.email)
        setMyListings(userListings)
        localStorage.setItem('cached_my_listings', JSON.stringify(userListings))
      }
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle Profile Picture Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUpdating(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setEditData(prev => ({ ...prev, picture: data.url }))
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (err) {
      alert('Failed to upload image')
    } finally {
      setUpdating(false)
    }
  }

  // Handle Saving Profile Changes
  const handleSaveProfile = async () => {
    setUpdating(true)
    try {
      const token = getAuthToken()
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      })

      const result = await response.json()
      if (response.ok) {
        // Sync local storage and current state
        localStorage.setItem('user', JSON.stringify(result.user))
        setUser(result.user)
        setEditMode(false)
        alert('Profile updated successfully! ✨')
      } else {
        alert(result.error || 'Update failed')
      }
    } catch (error) {
      alert('Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const updated = myListings.filter(l => l._id !== listingId)
        setMyListings(updated)
        localStorage.setItem('cached_my_listings', JSON.stringify(updated))
        alert('Listing deleted!')
      }
    } catch (error) {
      alert('Delete failed')
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16 sm:h-[72px]">
          <h1 className="text-lg sm:text-xl font-semibold">My Profile</h1>
          <button onClick={() => confirm('Logout?') && logout()} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <main className="pt-20 px-4 max-w-4xl mx-auto">
        
        {/* Profile Card Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            {/* Avatar with Camera Button */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center text-blue-600 text-4xl font-bold border-4 border-white shadow-md">
                {user.picture ? (
                  <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
              </div>
              <button 
                onClick={() => setEditMode(true)}
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                <Camera size={18} />
              </button>
            </div>

            {/* User Details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <button 
                  onClick={() => setEditMode(true)} 
                  className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
                >
                  <Edit size={14} /> Edit Profile
                </button>
              </div>
              <div className="space-y-2 text-gray-600 text-sm">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail size={16} className="text-gray-400" /> {user.email}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Phone size={16} className="text-gray-400" /> {user.phone || 'No phone added'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
          <NotificationSettingsButton userId={user?.id} />
        </div>

        {/* Help & Support */}
        <Link href="/contact">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3">
               <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><MessageSquare size={20} /></div>
               <div>
                  <h3 className="font-semibold text-gray-900">Help & Support</h3>
                  <p className="text-xs text-gray-500">Contact our campus support team</p>
               </div>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        {/* Listings Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Package size={20} className="text-blue-600" /> My Listings ({myListings.length})
            </h3>
            <Link href="/post" className="text-blue-600 text-sm font-bold hover:underline">+ New Post</Link>
          </div>
          
          <div className="p-4 space-y-4">
            {myListings.length === 0 ? (
              <p className="text-center py-10 text-gray-500">No listings found.</p>
            ) : (
              myListings.map(listing => (
                <div key={listing._id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-shadow gap-4">
                  <div className="flex items-center gap-4 w-full">
                    <div className="text-4xl">{getCategoryEmoji(listing.category)}</div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{listing.title}</h4>
                      <p className="text-xs text-gray-500">₹{listing.price.toLocaleString()} • {listing.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link href={`/listing/${listing._id}`} className="flex-1 text-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">View</Link>
                    <button onClick={() => handleDeleteListing(listing._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* --- EDIT PROFILE MODAL --- */}
      {editMode && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
              <button onClick={() => setEditMode(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Image Editor Container */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-50 bg-gray-100 shadow-inner">
                  {updating && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                      <Loader2 className="animate-spin text-blue-600" />
                    </div>
                  )}
                  <img 
                    src={editData.picture || user.picture || 'https://via.placeholder.com/150'} 
                    className="w-full h-full object-cover" 
                    alt="Preview"
                  />
                </div>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  className="text-sm font-bold text-blue-600 hover:underline active:opacity-70"
                >
                  Change Profile Photo
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editData.name} 
                    onChange={e => setEditData({...editData, name: e.target.value})} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={editData.phone} 
                    onChange={e => setEditData({...editData, phone: e.target.value})} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900" 
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={handleSaveProfile} 
                  disabled={updating}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 className="animate-spin" /> : 'Update Profile Details'}
                </button>
                <button 
                  onClick={() => setEditMode(false)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}