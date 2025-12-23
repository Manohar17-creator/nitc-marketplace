'use client'
import { useState, useEffect, Suspense } from 'react' // 👈 Import Suspense
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Trash2, Plus, Shield, Search, Ban, UserCheck, Bell, Send, Eye, MousePointer2, MousePointerClick, Calendar, Edit2 } from 'lucide-react'
import { getStoredUser } from '@/lib/auth-utils'

// 👇 1. Rename your main component to 'DashboardContent' (Internal use only)
function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize Tab from URL or default to 'requests'
  const initialTab = searchParams.get('tab') || 'requests'
  const [activeTab, setActiveTab] = useState(initialTab) 
  
  // Data States
  const [pendingRequests, setPendingRequests] = useState([])
  const [allCommunities, setAllCommunities] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [allListings, setAllListings] = useState([])
  const [allEvents, setAllEvents] = useState([])
  
  const [userSearch, setUserSearch] = useState('')
  const [listingSearch, setListingSearch] = useState('')
  const [eventSearch, setEventSearch] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'info' })
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  // New Community Form
  const [isCreating, setIsCreating] = useState(false)
  const [newComm, setNewComm] = useState({ name: '', description: '', icon: '⚡' })

  // Ads State
  const [allAds, setAllAds] = useState([])
  const [isCreatingAd, setIsCreatingAd] = useState(false)
  const [editingAdId, setEditingAdId] = useState(null)
  const [newAd, setNewAd] = useState({ 
  title: '', 
  imageUrl: '', 
  link: '', 
  type: 'local', 
  description: '',
  placement: 'all' // 👈 Default to 'all'
})

  // Switch Tab Helper (Updates URL)
  const switchTab = (tab) => {
    setActiveTab(tab)
    router.replace(`/admin/dashboard?tab=${tab}`, { scroll: false })
  }

  useEffect(() => {
    const user = getStoredUser()
    if (user?.email !== 'kandula_b220941ec@nitc.ac.in') {
      alert('Access denied - Admin only')
      router.push('/')
      return
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const [reqRes, commRes, userRes, listRes, adsRes,eventsRes] = await Promise.all([
        fetch('/api/admin/community-requests', { headers }),
        fetch('/api/communities', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/listings', { headers }),
        fetch('/api/ads'),
        fetch('/api/events')
      ])

      if (reqRes.ok) setPendingRequests((await reqRes.json()).requests || [])
      if (commRes.ok) setAllCommunities((await commRes.json()).communities || [])
      if (userRes.ok) setAllUsers((await userRes.json()).users || [])
      if (listRes.ok) setAllListings((await listRes.json()).listings || [])
      if (adsRes.ok) setAllAds((await adsRes.json()).ads || [])
        if (eventsRes.ok) {
        const data = await eventsRes.json()
        // The API returns a mixed feed, so we filter only the events
        const onlyEvents = (data.feed || [])
          .filter(item => item.type === 'event')
          .map(item => item.data)
        setAllEvents(onlyEvents)
      }

    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---

  const handleRequestAction = async (requestId, action) => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this request?`)) return
    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/community-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchData()
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteCommunity = async (commId) => {
    if (!confirm('⚠️ Delete this community? This cannot be undone.')) return
    setProcessingId(commId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/communities/${commId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchData()
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreateCommunity = async (e) => {
    e.preventDefault()
    if (!newComm.name) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newComm, color: '#2563eb' })
      })
      if (res.ok) {
        setIsCreating(false)
        setNewComm({ name: '', description: '', icon: '⚡' })
        fetchData()
      }
    } catch (err) { alert('Failed') }
  }

  const handleUserBan = async (userId, currentStatus) => {
    const action = currentStatus === 'banned' ? 'unban' : 'ban'
    if (!confirm(`${action === 'ban' ? 'Ban' : 'Unban'} this user?`)) return
    setProcessingId(userId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert(`User ${action}ned`)
        fetchData()
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteListing = async (listingId) => {
    if (!confirm('🗑️ Delete this listing permanently?')) return
    setProcessingId(listingId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/listings?id=${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setAllListings(prev => prev.filter(l => l._id !== listingId))
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleSendBroadcast = async (e) => {
    e.preventDefault()
    if (!confirm(`Send this to ALL ${allUsers.length} users?`)) return

    setSendingBroadcast(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(broadcastForm)
      })

      if (res.ok) {
        alert('Broadcast Sent Successfully! 🚀')
        setBroadcastForm({ title: '', message: '', type: 'info' })
      } else {
        alert('Failed to send broadcast')
      }
    } catch (err) {
      console.error(err)
      alert('Error sending broadcast')
    } finally {
      setSendingBroadcast(false)
    }
  }

const startEditAd = (ad) => {
    setNewAd({
      title: ad.title,
      imageUrl: ad.imageUrl,
      link: ad.link || '',
      type: ad.type || 'local',
      description: ad.description || '',
      placement: ad.placement || 'all'
    })
    setEditingAdId(ad._id)
    setIsCreatingAd(true)
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

const handleSubmitAd = async (e) => {
    e.preventDefault()
    if (!newAd.title || !newAd.imageUrl) return

    const token = localStorage.getItem('token')
    // 👇 FIXED: Logic to switch between PUT (Update) and POST (Create)
    const method = editingAdId ? 'PUT' : 'POST'
    
    // If editing, we MUST include the _id in the body for the API to know which one to update
    const body = editingAdId ? { ...newAd, _id: editingAdId } : newAd

    try {
      const res = await fetch('/api/ads', {  // Changed from /api/admin/ads to /api/ads
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        alert(editingAdId ? 'Ad Updated! ✅' : 'Ad Created! 📢')
        setIsCreatingAd(false)
        setEditingAdId(null)
        setNewAd({ title: '', imageUrl: '', link: '', type: 'local', description: '', placement: 'all' })
        fetchData() // Refresh list
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (err) { 
      console.error(err)
      alert('Failed to save ad') 
    }
  }

  const handleDeleteAd = async (adId) => {
    if (!confirm('Delete this ad?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/ads?id=${adId}`, { // Changed from /api/admin/ads to /api/ads
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setAllAds(prev => prev.filter(a => a._id !== adId))
      }
    } catch (err) { alert('Failed to delete') }
  }

  // 👇 ADD THIS HANDLER FOR EVENTS IF MISSING
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('🗑️ Delete this event permanently?')) return
    setProcessingId(eventId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setAllEvents(prev => prev.filter(e => e._id !== eventId))
      }
    } finally {
      setProcessingId(null)
    }
  }

  // Filters
  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredListings = allListings.filter(l => 
    l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
    l.sellerName?.toLowerCase().includes(listingSearch.toLowerCase())
  )

  const filteredEvents = allEvents.filter(e => e.title.toLowerCase().includes(eventSearch.toLowerCase()))


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe">
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-700 to-indigo-800 text-white z-20 shadow-md safe-top">
        <div className="max-w-4xl mx-auto px-4 h-[64px] sm:h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Shield size={18} /> Admin Panel
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-[80px] px-4 pb-8 max-w-4xl mx-auto">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-200 overflow-x-auto scrollbar-hide">
          {['requests', 'manage', 'users', 'listings', 'events', 'ads', 'broadcast'].map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md whitespace-nowrap capitalize ${
                activeTab === tab ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
              {tab === 'requests' && pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map(request => (
                <div key={request._id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      {request.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{request.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      <div className="text-xs text-gray-400">
                        Requested by: {request.requestedByName}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleRequestAction(request._id, 'approve')}
                        disabled={processingId === request._id}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequestAction(request._id, 'reject')}
                        disabled={processingId === request._id}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MANAGE COMMUNITIES */}
        {activeTab === 'manage' && (
          <div>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="w-full mb-4 py-3 bg-white border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {isCreating ? 'Cancel' : 'Create New Community'}
            </button>

            {isCreating && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 animate-in fade-in">
                <form onSubmit={handleCreateCommunity} className="space-y-3">
                  <input
                    placeholder="Community Name"
                    className="w-full p-2 border rounded"
                    value={newComm.name}
                    onChange={e => setNewComm({...newComm, name: e.target.value})}
                  />
                  <input
                    placeholder="Description"
                    className="w-full p-2 border rounded"
                    value={newComm.description}
                    onChange={e => setNewComm({...newComm, description: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Icon (🚀)"
                      className="w-20 p-2 border rounded text-center"
                      value={newComm.icon}
                      onChange={e => setNewComm({...newComm, icon: e.target.value})}
                    />
                    <button className="flex-1 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                      Create
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {allCommunities.map(comm => (
                <div key={comm._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{comm.icon}</div>
                    <div>
                      <h4 className="font-bold text-gray-900">{comm.name}</h4>
                      <p className="text-xs text-gray-500">{comm.memberCount || 0} members</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCommunity(comm._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
              {filteredUsers.map(u => (
                <div key={u._id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.status === 'banned' ? 'bg-gray-400' : 'bg-blue-500'}`}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${u.status === 'banned' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{u.name}</h4>
                        {u.status === 'banned' && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">BANNED</span>}
                      </div>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUserBan(u._id, u.status)}
                    disabled={processingId === u._id}
                    className={`p-2 rounded-lg ${u.status === 'banned' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}
                  >
                    {u.status === 'banned' ? <UserCheck size={18} /> : <Ban size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LISTINGS */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search listings..."
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
              {filteredListings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No listings found</div>
              ) : (
                filteredListings.map(item => (
                  <div key={item._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-xs">{item.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="text-green-600 font-bold">₹{item.price}</span>
                          <span>•</span>
                          <span className="truncate">{item.category}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteListing(item._id)}
                      disabled={processingId === item._id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Listing"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4 text-gray-800">
              <Bell className="text-blue-600" />
              <h2 className="text-lg font-bold">Broadcast Message</h2>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Warning:</strong> This message will be sent to <strong>{allUsers.length} users</strong> immediately.
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notification Title</label>
                <input 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Server Maintenance"
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message Body</label>
                <textarea 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                  placeholder="Type your message here..."
                  value={broadcastForm.message}
                  onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})}
                  required
                />
              </div>

              <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Type</label>
  <div className="flex gap-4">
    {['info', 'success', 'warning', 'error'].map(t => (
      <label 
        key={t} 
        className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all ${
          broadcastForm.type === t 
            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-700' // ✅ Added text-blue-700
            : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700'   // ✅ Added text-gray-700
        }`}
      >
        <input 
          type="radio" 
          name="type" 
          className="hidden" 
          checked={broadcastForm.type === t}
          onChange={() => setBroadcastForm({...broadcastForm, type: t})}
        />
        <span className="capitalize text-sm font-semibold">{t}</span>
      </label>
    ))}
</div>
</div>

              <button 
                disabled={sendingBroadcast}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-3.5 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {sendingBroadcast ? 'Sending...' : <><Send size={18} /> Send Broadcast</>}
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: ADS */}
        {/* TAB: ADS */}
        {activeTab === 'ads' && (
          <div>
            <button
              onClick={() => {
                setIsCreatingAd(!isCreatingAd)
                setEditingAdId(null)
                // Reset form
                setNewAd({ title: '', imageUrl: '', link: '', type: 'local', description: '', placement: 'all' })
              }}
              className="w-full mb-4 py-3 bg-white border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Plus size={20} /> {isCreatingAd ? 'Cancel' : 'Create New Ad'}
            </button>

            {isCreatingAd && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <form onSubmit={handleSubmitAd} className="space-y-3">
                  
                  {/* 👇 ALL INPUTS ARE HERE NOW */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                    <input 
                      placeholder="Ad Title" 
                      className="w-full p-2 border rounded" 
                      value={newAd.title} 
                      onChange={e => setNewAd({...newAd, title: e.target.value})} 
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                    <input 
                      placeholder="https://..." 
                      className="w-full p-2 border rounded" 
                      value={newAd.imageUrl} 
                      onChange={e => setNewAd({...newAd, imageUrl: e.target.value})} 
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Link (Optional)</label>
                    <input 
                      placeholder="https://..." 
                      className="w-full p-2 border rounded" 
                      value={newAd.link} 
                      onChange={e => setNewAd({...newAd, link: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <input 
                      placeholder="e.g. Flat 50% Off on Books" 
                      className="w-full p-2 border rounded" 
                      value={newAd.description} 
                      onChange={e => setNewAd({...newAd, description: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                      <select className="w-full p-2 border rounded" value={newAd.type} onChange={e => setNewAd({...newAd, type: e.target.value})}>
                        <option value="local">📍 Local Ad</option>
                        <option value="online">🌐 Online Ad</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Placement</label>
                      <select className="w-full p-2 border rounded" value={newAd.placement} onChange={e => setNewAd({...newAd, placement: e.target.value})}>
                        <option value="all">🏠 + 📅 Everywhere</option>
                        <option value="home">🏠 Home Only</option>
                        <option value="events">📅 Events Only</option>
                      </select>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors">
                    {editingAdId ? 'Update Ad' : 'Launch Ad'}
                  </button>
                </form>
              </div>
            )}

            <div className="space-y-4">
  {allAds.map(ad => (
    <div key={ad._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4 relative">
      
      {/* 1. Ad Image */}
      <img 
        src={ad.imageUrl} 
        alt={ad.title}
        className="w-24 h-24 object-cover rounded-md bg-gray-100 border border-gray-100" 
      />

      {/* 2. Ad Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
          <p className="text-xs text-gray-500 mb-2 line-clamp-1">{ad.description || 'No description'}</p>
          
          <div className="flex gap-2 mb-3">
            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
              ad.type === 'local' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {ad.type}
            </span>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold uppercase">
              {ad.placement || 'all'}
            </span>
          </div>
        </div>

        {/* 👇 NEW: Stats Row (Impressions & Clicks) */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100 w-fit">
          <div className="flex items-center gap-1.5" title="Total Views">
            <Eye size={14} className="text-blue-500" />
            <span>{ad.views || 0}</span>
          </div>
          <div className="w-px h-3 bg-gray-300"></div> {/* Divider */}
          <div className="flex items-center gap-1.5" title="Total Clicks">
            <MousePointerClick size={14} className="text-green-500" />
            <span>{ad.clicks || 0}</span>
          </div>
          <div className="w-px h-3 bg-gray-300"></div> {/* Divider */}
          <div className="text-[10px] text-gray-400">
             CTR: {((ad.clicks || 0) / (ad.views || 1) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* 3. Action Buttons */}
      <div className="flex flex-col gap-2 border-l pl-3 ml-1 border-dashed border-gray-200 justify-center">
        <button 
          onClick={() => startEditAd(ad)} 
          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
          title="Edit Ad"
        >
          <Edit2 size={18} />
        </button>
        <button 
          onClick={() => handleDeleteAd(ad._id)} 
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
          title="Delete Ad"
        >
          <Trash2 size={18} />
        </button>
      </div>

    </div>
  ))}
</div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <input type="text" placeholder="Search events..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} className="w-full p-3 bg-white border rounded-lg" />
            <div className="bg-white rounded-lg shadow-sm border divide-y">
              {filteredEvents.length === 0 ? <p className="p-8 text-center text-gray-500">No events found</p> :
                filteredEvents.map(event => (
                  <div key={event._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                         <Calendar size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-xs">{event.title}</h4>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>{new Date(event.eventDate).toDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteEvent(event._id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 👇 2. Export the main component that uses Suspense
export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}