'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MessageSquare, Briefcase, Star, Users as UsersIcon, Plus, Trash2, LogOut } from 'lucide-react'
import Link from 'next/link'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'
import CreatePostModal from '@/components/CreatePostModal'

export default function CommunityDetailPage({ params }) {
  const router = useRouter()
  const [communityId, setCommunityId] = useState(null)
  const [community, setCommunity] = useState(null)
  const [activeTab, setActiveTab] = useState('feed')
  
  const [posts, setPosts] = useState([])
  const [members, setMembers] = useState([])
  
  // 🆕 Split Loading States
  const [pageLoading, setPageLoading] = useState(true) // For Community Info
  const [postsLoading, setPostsLoading] = useState(true) // For Posts List
  
  const [showPostModal, setShowPostModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  // ✅ CACHING STATE
  const [cachedPosts, setCachedPosts] = useState({
    feed: null,
    job: null,
    portfolio: null
  })
  const [cachedMembers, setCachedMembers] = useState(null)

  useEffect(() => {
    const init = async () => {
      // 1. Get Params
      const resolvedParams = await params
      const id = resolvedParams.id
      setCommunityId(id)

      // 2. Fetch Community Info (Page Load)
      await fetchCommunity(id)
      
      // 3. Fetch Initial Posts (Posts Load)
      // We set this manually here to ensure the spinner shows immediately
      setPostsLoading(true) 
      await fetchPosts(id, 'feed')
    }
    
    init()

    if (typeof window !== 'undefined') {
      const user = getUserData()
      if (user) setCurrentUserId(user.id)
      else router.push('/login')
    }
  }, [params, router])

  // ✅ LISTEN FOR NEW POSTS VIA WEBSOCKET (Polling)
  useEffect(() => {
    if (!communityId) return
    const pollInterval = setInterval(() => {
      if (activeTab !== 'members') {
        // Pass 'true' for isBackground to prevent loading spinner during polling
        fetchPosts(communityId, activeTab, true) 
      }
    }, 5000)
    return () => clearInterval(pollInterval)
  }, [communityId, activeTab])

  const fetchCommunity = async (id) => {
    try {
      const response = await fetch(`/api/communities/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCommunity(data.community)
      }
    } catch (error) {
      console.error('Failed to fetch community:', error)
    } finally {
      setPageLoading(false) // Only stop page loading here
    }
  }

  // ✅ OPTIMIZED FETCH WITH CACHING & LOADING CONTROL
  const fetchPosts = async (id, type, isBackground = false) => {
    if (!isBackground) setPostsLoading(true) // Show spinner for manual actions
    
    try {
      let url = `/api/communities/${id}/posts?type=${type}`
      
      if (type === 'portfolio') {
        const token = getAuthToken()
        if (!token) {
          setPosts([])
          setCachedPosts(prev => ({ ...prev, portfolio: [] }))
          setPostsLoading(false)
          return
        }
        url = `/api/communities/${id}/posts/my-portfolio`
      }

      const token = getAuthToken()
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const response = await fetch(url, { headers })
      const data = await response.json()
      
      if (response.ok) {
        setPosts(data.posts)
        // Update Cache
        setCachedPosts(prev => ({ ...prev, [type]: data.posts }))
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      if (!isBackground) setPostsLoading(false) // Hide spinner
    }
  }

  const fetchMembers = async (id) => {
    if (cachedMembers) {
      setMembers(cachedMembers)
      setPostsLoading(false) // Instant load if cached
      return
    }

    setPostsLoading(true)
    try {
      const response = await fetch(`/api/communities/${id}/members`)
      const data = await response.json()
      if (response.ok) {
        setMembers(data.members)
        setCachedMembers(data.members)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  // ✅ INSTANT TAB SWITCHING LOGIC
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    
    if (tab === 'members') {
      fetchMembers(communityId)
    } else {
      // Check Cache First
      if (cachedPosts[tab]) {
        setPosts(cachedPosts[tab]) // ⚡ Instant render
        setPostsLoading(false)     // No spinner needed
      } else {
        setPosts([])               // Clear old posts
        fetchPosts(communityId, tab, false) // Fetch new (Show spinner)
      }
    }
  }

  // ... (Keep handleCreatePost, handleLeaveCommunity, handleDeletePost, getEmbedPreview, formatTime as they were) ...
  const handleCreatePost = async (postData) => {
      try {
        const res = await fetch('/api/posts', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...postData, communityId: communityId })
        })
        if (res.ok) {
          setShowPostModal(false)
          fetchPosts(communityId, activeTab) // Refresh current tab
        } else {
          throw new Error('Failed to create post')
        }
      } catch (error) { throw error }
  }

  const handleLeaveCommunity = async () => {
      if (!confirm('Are you sure you want to leave this community?')) return
      try {
        const token = getAuthToken()
        const response = await fetch(`/api/communities/${communityId}/join`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          alert('Left community successfully')
          router.push('/communities')
        }
      } catch (error) { console.error('Failed to leave:', error) }
  }

  const handleDeletePost = async (postId) => {
      if (!confirm('Delete this post?')) return
      try {
        const token = getAuthToken()
        const response = await fetch(`/api/communities/posts/${postId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          setPosts(prev => prev.filter(p => p._id !== postId))
          setCachedPosts(prev => ({
            feed: prev.feed?.filter(p => p._id !== postId) || null,
            job: prev.job?.filter(p => p._id !== postId) || null,
            portfolio: prev.portfolio?.filter(p => p._id !== postId) || null
          }))
          alert('Post deleted successfully')
        } 
      } catch (error) { console.error('Failed to delete:', error) }
  }

  const getEmbedPreview = (embedUrl, embedType) => {
      if (!embedUrl) return null
      if (embedType === 'youtube') {
        const videoId = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
        if (videoId) {
          return (
            <div className="mt-3 aspect-video rounded-lg overflow-hidden">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen />
            </div>
          )
        }
      }
      return <a href={embedUrl} target="_blank" className="mt-3 block text-blue-600 hover:text-blue-700 text-sm break-all">🔗 {embedUrl}</a>
  }

  const formatTime = (date) => {
      const now = new Date(); const posted = new Date(date); const diffMs = now - posted; const diffMins = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMins / 60); const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 1) return 'Just now'; if (diffMins < 60) return `${diffMins}m ago`; if (diffHours < 24) return `${diffHours}h ago`; if (diffDays === 1) return 'Yesterday'; return posted.toLocaleDateString();
  }


  // 🛑 PAGE LOADING SPINNER (Only for initial community info)
  if (pageLoading || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col pb-nav-safe">
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px] transition-all duration-300 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={() => router.push('/communities')} className="flex-shrink-0 hover:opacity-80 active:scale-95 transition p-1 -ml-1">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold truncate leading-tight">{community.name}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowPostModal(true)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors active:scale-95">
              <Plus size={24} />
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu((prev) => !prev)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-xl font-bold pb-1">⋯</button>
              {showMenu && (
                <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl ring-1 ring-black/5 w-48 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => { setShowMenu(false); handleLeaveCommunity() }} className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                    <LogOut size={18} /> <span className="font-medium">Leave Community</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b fixed top-[64px] sm:top-[72px] left-0 right-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex overflow-x-auto scrollbar-hide">
          {['feed', 'job', 'portfolio', 'members'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 min-w-[80px] px-4 py-3 font-medium text-sm transition-colors capitalize ${
                activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[46px]" />

      <div className="max-w-4xl mx-auto p-4 flex-1 w-full pt-[100px] sm:pt-[110px]">
        
        {/* 🆕 CONTENT LOADING LOGIC */}
        {postsLoading ? (
          // SKELETON LOADER (While fetching posts)
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : activeTab !== 'members' ? (
          // POSTS CONTENT
          <div className="space-y-4">
            {!posts?.length ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                <p className="text-gray-600 mb-2 font-medium">No posts found</p>
                <p className="text-gray-500 text-sm">Be the first to share something!</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post._id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  {/* Post Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {post.authorName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/communities/${communityId}/member/${post.authorId}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                        {post.authorName}
                      </Link>
                      <div className="text-xs text-gray-500">{formatTime(post.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                       {post.type === 'job' && <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">💼 Job</span>}
                       {post.type === 'portfolio' && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">⭐ Portfolio</span>}
                       {currentUserId === post.authorId?.toString() && (
                          <button onClick={() => handleDeletePost(post._id)} className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                       )}
                    </div>
                  </div>
                  {post.title && <h3 className="font-bold text-gray-900 text-lg mb-2">{post.title}</h3>}
                  <p className="text-gray-700 whitespace-pre-wrap mb-2">{post.content}</p>
                  {post.embedUrl && getEmbedPreview(post.embedUrl, post.embedType)}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                    <Link href={`/communities/post/${post._id}`} className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-sm">
                      <MessageSquare size={16} /> <span>{post.commentCount || 0} comments</span>
                    </Link>
                    {post.type === 'job' && <Link href={`/communities/post/${post._id}`} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">I am Interested</Link>}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // MEMBERS CONTENT
          <div className="space-y-3">
            {!members?.length ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <UsersIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No members yet</p>
              </div>
            ) : (
              members.map(member => (
                <div key={member._id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-600 truncate">{member.email}</div>
                    </div>
                    <Link href={`/communities/${communityId}/member/${member.userId}`} className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
                      View Posts
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showPostModal && <CreatePostModal onClose={() => setShowPostModal(false)} onSubmit={handleCreatePost} />}
    </div>
  )
}