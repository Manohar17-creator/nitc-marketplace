'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'

export default function CommunitiesPage() {
  const router = useRouter()
  const [communities, setCommunities] = useState([])
  const [myCommunitiesIds, setMyCommunitiesIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningId, setJoiningId] = useState(null)

  useEffect(() => {
    fetchCommunities()
    fetchMyCommunities()

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMyCommunities()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchCommunities = async () => {
    try {
      const response = await fetch('/api/communities')
      const data = await response.json()
      
      if (response.ok) {
        setCommunities(data.communities)
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyCommunities = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/communities/my-communities', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('My communities:', data.communityIds)
        // Ensure all IDs are strings
        setMyCommunitiesIds(data.communityIds.map(id => String(id)))
      }
    } catch (error) {
      console.error('Failed to fetch my communities:', error)
    }
  }

  const handleJoinCommunity = async (communityId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      setJoiningId(communityId)

      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Update the state immediately to reflect the join
        setMyCommunitiesIds(prev => [...prev, String(communityId)])
        
        // Navigate to the community
        router.push(`/communities/${communityId}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to join community')
      }
    } catch (error) {
      console.error('Failed to join:', error)
      alert('Something went wrong')
    } finally {
      setJoiningId(null)
    }
  }

  const handleViewCommunity = (communityId) => {
    router.push(`/communities/${communityId}`)
  }

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Users size={28} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Communities</h1>
                <p className="text-blue-100 text-xs sm:text-sm">
                  {myCommunitiesIds.length} joined
                </p>
              </div>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm font-medium"
            >
              Home
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      {/* Communities List */}
      <div className="max-w-4xl mx-auto p-4 flex-1 w-full pb-8">
        <div className="space-y-3">
          {filteredCommunities.map(community => {
            const communityIdStr = String(community._id)
            const isJoined = myCommunitiesIds.includes(communityIdStr)
            const isJoining = joiningId === communityIdStr
            
            return (
              <div
                key={community._id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="text-4xl flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${community.color}20` }}
                  >
                    {community.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1">
                      {community.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {community.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{community.memberCount} members</span>
                      <span>•</span>
                      <span>{community.postCount} posts</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {isJoined ? (
                      <button
                        onClick={() => handleViewCommunity(communityIdStr)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap justify-center"
                      >
                        View
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinCommunity(communityIdStr)}
                        disabled={isJoining}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isJoining ? 'Joining...' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredCommunities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No communities found</p>
          </div>
        )}
      </div>
    </div>
  )
}