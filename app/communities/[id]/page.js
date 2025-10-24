'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MessageSquare, Briefcase, Star, Users as UsersIcon, Plus, Send, Trash2, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useSocket } from '@/hooks/useSocket'

export default function CommunityDetailPage({ params }) {
  const router = useRouter()
  const [communityId, setCommunityId] = useState(null)
  const [community, setCommunity] = useState(null)
  const [activeTab, setActiveTab] = useState('feed')
  const [posts, setPosts] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPostModal, setShowPostModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  
  // ✅ CACHING STATE
  const [cachedPosts, setCachedPosts] = useState({
    feed: null,
    job: null,
    portfolio: null
  })
  const [cachedMembers, setCachedMembers] = useState(null)

  // ✅ WEBSOCKET CONNECTION
  const { socket, isConnected } = useSocket(communityId)

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params
      const id = resolvedParams.id
      setCommunityId(id)
      await fetchCommunity(id)
      await fetchPosts(id, 'feed')
    }
    fetchData()

    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setCurrentUserId(user.id)
    }
  }, [params])

  // ✅ LISTEN FOR NEW POSTS VIA WEBSOCKET
  useEffect(() => {
    if (!socket) return

    socket.on('new-post', (newPost) => {
      console.log('New post received:', newPost)
      
      // Add to current view if matching type
      if (activeTab === newPost.type || activeTab === 'feed') {
        setPosts(prev => [newPost, ...prev])
      }
      
      // Update cache for that post type
      setCachedPosts(prev => ({
        ...prev,
        [newPost.type]: prev[newPost.type] ? [newPost, ...prev[newPost.type]] : [newPost],
        feed: prev.feed ? [newPost, ...prev.feed] : [newPost]
      }))
    })

    return () => {
      socket.off('new-post')
    }
  }, [socket, activeTab])

  const fetchCommunity = async (id) => {
    try {
      const response = await fetch(`/api/communities/${id}`)
      const data = await response.json()
      
      if (response.ok) {
        setCommunity(data.community)
      }
    } catch (error) {
      console.error('Failed to fetch community:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveCommunity = async () => {
    if (!confirm('Are you sure you want to leave this community?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Left community successfully')
        router.push('/communities')
      }
    } catch (error) {
      console.error('Failed to leave:', error)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/communities/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Remove from current view
        setPosts(prev => prev.filter(p => p._id !== postId))
        
        // Remove from cache
        setCachedPosts(prev => ({
          feed: prev.feed?.filter(p => p._id !== postId) || null,
          job: prev.job?.filter(p => p._id !== postId) || null,
          portfolio: prev.portfolio?.filter(p => p._id !== postId) || null
        }))
        
        alert('Post deleted successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  // ✅ OPTIMIZED FETCH WITH CACHING
  const fetchPosts = async (id, type) => {
    try {
      let url = `/api/communities/${id}/posts?type=${type}`
      
      if (type === 'portfolio') {
        const token = localStorage.getItem('token')
        if (!token) {
          setPosts([])
          setCachedPosts(prev => ({ ...prev, portfolio: [] }))
          return
        }
        url = `/api/communities/${id}/posts/my-portfolio`
      }

      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const response = await fetch(url, { headers })
      const data = await response.json()
      
      if (response.ok) {
        setPosts(data.posts)
        // Cache the data
        setCachedPosts(prev => ({ ...prev, [type]: data.posts }))
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    }
  }

  const fetchMembers = async (id) => {
    // Use cache if available
    if (cachedMembers) {
      setMembers(cachedMembers)
    }

    try {
      const response = await fetch(`/api/communities/${id}/members`)
      const data = await response.json()
      
      if (response.ok) {
        setMembers(data.members)
        setCachedMembers(data.members)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }

  // ✅ INSTANT TAB SWITCHING
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    
    if (tab === 'members') {
      // Show cached members immediately
      if (cachedMembers) {
        setMembers(cachedMembers)
      }
      fetchMembers(communityId)
    } else {
      // Show cached posts immediately
      if (cachedPosts[tab]) {
        setPosts(cachedPosts[tab])
      } else {
        setPosts([])
      }
      // Fetch fresh data in background
      fetchPosts(communityId, tab)
    }
  }

  const getEmbedPreview = (embedUrl, embedType) => {
    if (!embedUrl) return null

    if (embedType === 'youtube') {
      const videoId = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      if (videoId) {
        return (
          <div className="mt-3 aspect-video rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }
    }

    if (embedType === 'instagram') {
      return (
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-purple-700">
            <span className="text-2xl">📷</span>
            <span className="font-medium">View on Instagram</span>
          </div>
        </a>
      )
    }

    return (
      <a
        href={embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block text-blue-600 hover:text-blue-700 text-sm break-all"
      >
        🔗 {embedUrl}
      </a>
    )
  }

  const formatTime = (date) => {
    const now = new Date()
    const posted = new Date(date)
    const diffMs = now - posted
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return posted.toLocaleDateString()
  }

  if (loading || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col pb-nav-safe">
      {/* Header */}
{/* Minimal Unified Header (with dropdown) */}
<div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 z-20 shadow-lg safe-top">
  <div className="max-w-6xl mx-auto">
    <div className="flex items-center justify-between px-4 h-[64px] sm:h-[72px]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/communities')}
          className="flex items-center gap-1 hover:opacity-80 active:scale-95 transition"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{community.name}</h1>
          <p className="text-blue-100 text-xs sm:text-sm">
            {community.memberCount} members • {community.postCount} posts
          </p>
        </div>
      </div>

      {/* Right: Add Post + More Menu */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPostModal(true)}
          className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
        >
          <Plus size={22} />
        </button>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            ⋯
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-lg w-40 overflow-hidden z-30">
              <button
                onClick={() => {
                  setShowMenu(false)
                  handleLeaveCommunity()
                }}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={16} />
                <span>Leave Community</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>





      {/* Tabs */}
      <div className="bg-white border-b sticky top-[120px] sm:top-[128px] z-10">
        <div className="max-w-4xl mx-auto flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleTabChange('feed')}
            className={`flex-1 min-w-[80px] px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'feed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => handleTabChange('job')}
            className={`flex-1 min-w-[80px] px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'job'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => handleTabChange('portfolio')}
            className={`flex-1 min-w-[90px] px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'portfolio'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => handleTabChange('members')}
            className={`flex-1 min-w-[90px] px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Members
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 flex-1 w-full">
        {/* Feed/Jobs/Portfolio Tab */}
        {activeTab !== 'members' && (
          <div className="space-y-4">
            {!posts?.length ? (
              <div className="text-center py-12 bg-white rounded-lg">
                {activeTab === 'feed' && (
                  <>
                    <p className="text-gray-600 mb-2">No posts yet</p>
                    <p className="text-gray-500 text-sm">Be the first to post!</p>
                  </>
                )}
                {activeTab === 'job' && (
                  <>
                    <p className="text-gray-600 mb-2">No jobs posted yet</p>
                    <p className="text-gray-500 text-sm">Post a collaboration opportunity!</p>
                  </>
                )}
                {activeTab === 'portfolio' && (
                  <>
                    <p className="text-gray-600 mb-2">Your portfolio is empty</p>
                    <p className="text-gray-500 text-sm">Share your work to showcase your skills</p>
                  </>
                )}
              </div>
            ) : (
              posts.map(post => (
                <div
                  key={post._id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Post Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {post.authorName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/communities/${communityId}/member/${post.authorId}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {post.authorName}
                      </Link>
                      <div className="text-xs text-gray-500">{formatTime(post.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.type === 'job' && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          💼 Job
                        </span>
                      )}
                      {post.type === 'portfolio' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          ⭐ Portfolio
                        </span>
                      )}
                      
                      {currentUserId === post.authorId?.toString() && (
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Title */}
                  {post.title && (
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      {post.title}
                    </h3>
                  )}

                  {/* Post Content */}
                  <p className="text-gray-700 whitespace-pre-wrap mb-2">
                    {post.content}
                  </p>

                  {/* Embed */}
                  {post.embedUrl && getEmbedPreview(post.embedUrl, post.embedType)}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                    <Link
                      href={`/communities/post/${post._id}`}
                      className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-sm"
                    >
                      <MessageSquare size={16} />
                      <span>{post.commentCount || 0} comments</span>
                    </Link>
                    
                    {post.type === 'job' && (
                      <Link
                        href={`/communities/post/${post._id}`}
                        className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        I am Interested
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            {!members?.length ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <UsersIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No members yet</p>
              </div>
            ) : (
              members.map(member => (
                <div
                  key={member._id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-600 truncate">{member.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      href={`/communities/${communityId}/member/${member.userId}`}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                    >
                      View Posts
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <PostModal
          communityId={communityId}
          activeTab={activeTab}
          onClose={() => setShowPostModal(false)}
          onSuccess={() => {
            setShowPostModal(false)
            // Data will update via WebSocket, but also refresh to be safe
            fetchPosts(communityId, activeTab)
          }}
        />
      )}
    </div>
  )
}

// Post Modal Component
function PostModal({ communityId, activeTab, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    type: activeTab === 'members' ? 'feed' : activeTab,
    title: '',
    content: '',
    embedUrl: '',
    embedType: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const detectEmbedType = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('instagram.com')) return 'instagram'
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
    return 'link'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.content.trim()) {
      setError('Please write something')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login first')
        setLoading(false)
        return
      }

      const embedType = formData.embedUrl ? detectEmbedType(formData.embedUrl) : null

      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          embedType
        })
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(data.error || 'Failed to create post')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Post Type */}
          <div className="mb-4">
            <label className="block text-gray-900 font-semibold mb-2 text-sm">
              Post Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="feed">Feed Post (Everyone can see)</option>
              <option value="job">Job/Collaboration (Everyone can see)</option>
              <option value="portfolio">Portfolio (Only visible in your profile)</option>
            </select>
          </div>

          {/* Title (for jobs and portfolio) */}
          {(formData.type === 'job' || formData.type === 'portfolio') && (
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={formData.type === 'job' ? 'e.g., Need Video Editor for Short Film' : 'e.g., My Latest Short Film'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Content */}
          <div className="mb-4">
            <label className="block text-gray-900 font-semibold mb-2 text-sm">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={5}
              placeholder="Write your post..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Embed URL */}
          <div className="mb-4">
            <label className="block text-gray-900 font-semibold mb-2 text-sm">
              Link (Optional)
            </label>
            <input
              type="url"
              value={formData.embedUrl}
              onChange={(e) => setFormData({ ...formData, embedUrl: e.target.value })}
              placeholder="YouTube, Instagram, or any link..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste YouTube or Instagram link to embed
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Posting...
              </>
            ) : (
              <>
                <Send size={18} />
                Post
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}