'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check, X, Clock } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    // Check if admin (you can add proper admin check here)
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    // For now, checking if email matches your admin email
    if (user.email !== 'kandula_b220941ec@nitc.ac.in') {
      alert('Access denied - Admin only')
      router.push('/')
      return
    }

    fetchPendingRequests()
  }, [router])

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/community-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        setPendingRequests(data.requests)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId) => {
    if (!confirm('Approve this community?')) return

    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/community-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Community approved! ✅')
        fetchPendingRequests()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to approve')
      }
    } catch (error) {
      console.error('Approve error:', error)
      alert('Failed to approve')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId) => {
    if (!confirm('Reject this community request?')) return

    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/community-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Request rejected')
        fetchPendingRequests()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to reject')
      }
    } catch (error) {
      console.error('Reject error:', error)
      alert('Failed to reject')
    } finally {
      setProcessingId(null)
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
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg safe-top">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 mb-3 hover:opacity-80 active:scale-95 transition"
          >
            <ChevronLeft size={22} />
            <span className="text-sm">Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <Clock size={28} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-purple-100 text-xs sm:text-sm">
                {pendingRequests.length} pending requests
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-4xl mx-auto p-4">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Clock size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div
                key={request._id}
                className="bg-white rounded-lg p-4 shadow-md border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="text-4xl w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${request.color}20` }}
                  >
                    {request.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {request.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {request.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      <p>Requested by: <span className="font-medium">{request.requestedByName}</span></p>
                      <p>Email: {request.requestedByEmail}</p>
                      <p>Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(request._id)}
                      disabled={processingId === request._id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      disabled={processingId === request._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}