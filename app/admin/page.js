'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check, X, Clock, Trash2, Plus, Users, Shield } from 'lucide-react'
import { getStoredUser } from '@/lib/auth-utils'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('requests') // 'requests' or 'manage'
  
  const [pendingRequests, setPendingRequests] = useState([])
  const [allCommunities, setAllCommunities] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  // New Community Form State
  const [isCreating, setIsCreating] = useState(false)
  const [newComm, setNewComm] = useState({ name: '', description: '', icon: '⚡' })

  useEffect(() => {
    const user = getStoredUser()
    // Admin Check
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

      // 1. Fetch Requests
      const reqRes = await fetch('/api/admin/community-requests', { headers })
      const reqData = await reqRes.json()
      if (reqRes.ok) setPendingRequests(reqData.requests || [])

      // 2. Fetch All Communities (for management)
      const commRes = await fetch('/api/communities', { headers })
      const commData = await commRes.json()
      if (commRes.ok) setAllCommunities(commData.communities || [])

    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- REQUEST ACTIONS ---
  const handleRequestAction = async (requestId, action) => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this request?`)) return
    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/community-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchData() // Refresh both lists
      } else {
        alert('Action failed')
      }
    } finally {
      setProcessingId(null)
    }
  }

  // --- MANAGE ACTIONS ---
  const handleDeleteCommunity = async (commId) => {
    if (!confirm('⚠️ Are you sure? This will delete the community and ALL posts inside it forever.')) return
    
    setProcessingId(commId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/communities/${commId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('Community deleted')
        fetchData()
      } else {
        alert('Failed to delete')
      }
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreateCommunity = async (e) => {
    e.preventDefault()
    if (!newComm.name || !newComm.description) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/communities', { // Direct creation endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newComm, color: '#2563eb' })
      })

      if (res.ok) {
        alert('Community Created! 🎉')
        setIsCreating(false)
        setNewComm({ name: '', description: '', icon: '⚡' })
        fetchData()
      }
    } catch (err) {
      alert('Failed to create')
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
    <div className="min-h-screen bg-gray-50 pb-nav-safe">
      
      {/* Header - Compact & Blue */}
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
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'requests' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'manage' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Manage All
          </button>
        </div>

        {/* TAB 1: REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Clock size={40} className="mx-auto text-gray-300 mb-3" />
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
            {/* Create New Button */}
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="w-full mb-4 py-3 bg-white border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {isCreating ? 'Cancel Creation' : 'Create New Community'}
            </button>

            {/* Create Form */}
            {isCreating && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <form onSubmit={handleCreateCommunity} className="space-y-3">
                  <input
                    placeholder="Community Name"
                    className="w-full p-2 border rounded"
                    value={newComm.name}
                    onChange={e => setNewComm({...newComm, name: e.target.value})}
                  />
                  <input
                    placeholder="Short Description"
                    className="w-full p-2 border rounded"
                    value={newComm.description}
                    onChange={e => setNewComm({...newComm, description: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Icon (e.g. 🚀)"
                      className="w-20 p-2 border rounded text-center"
                      value={newComm.icon}
                      onChange={e => setNewComm({...newComm, icon: e.target.value})}
                    />
                    <button className="flex-1 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
                      Create Now
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Existing List */}
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
                    title="Delete Community"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}