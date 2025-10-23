'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ChevronRight, Search, Plus, X } from 'lucide-react'
import Link from 'next/link'

export default function CommunitiesPage() {
  const router = useRouter()
  const [communities, setCommunities] = useState([])
  const [myCommunitiesIds, setMyCommunitiesIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningId, setJoiningId] = useState(null)
  const [isSearchVisible, setIsSearchVisible] = useState(false)

const toggleSearch = () => setIsSearchVisible(prev => !prev)


  useEffect(() => {
  // Load from cache immediately
  const cachedCommunities = localStorage.getItem('cached_communities')
  const cachedMyIds = localStorage.getItem('cached_my_community_ids')
  
  if (cachedCommunities) {
    setCommunities(JSON.parse(cachedCommunities))
    setLoading(false)
  }
  if (cachedMyIds) {
    setMyCommunitiesIds(JSON.parse(cachedMyIds))
  }

  // Fetch fresh data in background
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
      // Cache the data
      localStorage.setItem('cached_communities', JSON.stringify(data.communities))
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
      const ids = data.communityIds.map(id => String(id))
      setMyCommunitiesIds(ids)
      // Cache the data
      localStorage.setItem('cached_my_community_ids', JSON.stringify(ids))
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
      const newIds = [...myCommunitiesIds, String(communityId)]
      setMyCommunitiesIds(newIds)
      // Update cache
      localStorage.setItem('cached_my_community_ids', JSON.stringify(newIds))
      
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
      <div className="overflow-x-hidden bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="overflow-x-hidden bg-gray-50 flex flex-col">
      {/* Header */}
<div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
  <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px] transition-all duration-300">
    
    {/* Default (Collapsed) Header */}
    {!isSearchVisible ? (
      <>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Users size={24} className="text-white" />
          <div className="leading-tight">
            <h1 className="text-lg sm:text-xl font-semibold">Communities</h1>
            <p className="text-blue-100 text-xs sm:text-sm">
              {myCommunitiesIds.length} joined
            </p>
          </div>
        </div>

        {/* Search Icon */}
        <button
          onClick={toggleSearch}
          className="p-2 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all active:scale-95"
        >
          <Search size={20} className="text-white" />
        </button>
      </>
    ) : (
      /* Expanded Search Mode */
      <div className="flex items-center gap-2 w-full transition-all duration-300">
        <button
          onClick={toggleSearch}
          className="p-2 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all active:scale-95"
        >
          <X size={20} className="text-white" />
        </button>

        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200"
            size={16}
          />
          <input
            id="search-input"
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-blue-500/40 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>
    )}
  </div>
</div>

<main className="pt-[72px] pb-nav-safe  bg-gray-50 min-h-screen">



      {/* Communities List */}
      <div className="max-w-6xl mx-auto px-4 mt-4 mb-4">
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

      {/* Create Community Button - Fixed position above navbar */}
    <Link href="/communities/request">
    <button 
        className="fixed bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 font-semibold flex items-center gap-2 px-6 py-4 z-40"
        style={{
        bottom: `calc(72px + env(safe-area-inset-bottom))`,
        right: '16px'
        }}
    >
        <Plus size={20} />
        <span>Create</span>
    </button>
    </Link>
      {/* page content */}
</main>
    </div>
  )
}