'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MessageSquare, Plus, Trash2, LogOut, X, ChevronRight, Users as UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { getUserData, getAuthToken } from '@/lib/auth-client'
import CreatePostModal from '@/components/CreatePostModal'

// --- 1. Full Screen Image Gallery Modal (FIXED) ---
function ImageGalleryModal({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const handleNext = (e) => {
    e.stopPropagation()
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handlePrev = (e) => {
    e.stopPropagation()
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center" style={{ zIndex: 10000 }} onClick={onClose}>
      {/* 1. Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img 
          src={images[currentIndex]} 
          alt="Gallery" 
          className="max-w-full max-h-full object-contain select-none"
        />

        {/* 2. Navigation Arrows (Copying your listing logic) */}
        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-4 z-50 pointer-events-none">
            <button
              onClick={handlePrev}
              className="pointer-events-auto bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition backdrop-blur-sm active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="pointer-events-auto bg-black/40 hover:bg-black/60 text-white p-3 rounded-full transition backdrop-blur-sm active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* 3. Close Button */}
      <button onClick={onClose} className="absolute top-6 right-6 text-white p-2 bg-black/40 rounded-full z-[10001]">
        <X size={28} />
      </button>

      {/* 4. Counter */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white bg-black/40 px-4 py-1 rounded-full text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}

// Small preview carousel used in post previews (shows arrows like listing page)
function ImagePreviewCarousel({ images, onOpen }) {
  const [idx, setIdx] = useState(0)

  const handlePrev = (e) => {
    e.stopPropagation()
    setIdx(i => (i === 0 ? images.length - 1 : i - 1))
  }
  
  const handleNext = (e) => {
    e.stopPropagation()
    setIdx(i => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group">
      <div className="relative w-full h-[300px] sm:h-[400px] flex items-center justify-center">
        {/* ✅ Cursor is now only on the image */}
        <img
          src={images[idx]}
          alt="Post Preview"
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => onOpen(idx)}
        />

        {/* arrows container */}
        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 z-30 pointer-events-none">
            <button
              onClick={handlePrev}
              // ✅ Reduced padding (p-1.5) and ensures pointer cursor on hover
              className="pointer-events-auto bg-black/30 hover:bg-black/60 text-white p-1.5 rounded-full transition backdrop-blur-sm active:scale-90 cursor-pointer"
            >
              {/* ✅ Reduced size from 24 to 20 */}
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="pointer-events-auto bg-black/30 hover:bg-black/60 text-white p-1.5 rounded-full transition backdrop-blur-sm active:scale-90 cursor-pointer"
            >
              {/* ✅ Reduced size from 24 to 20 */}
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full">
          {images.map((_, i) => (
            <button 
              key={i} 
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`h-1.2 w-1.2 rounded-full transition-all cursor-pointer ${i === idx ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/80'}`} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommunityDetailPage({ params }) {
  const router = useRouter()
  const [communityId, setCommunityId] = useState(null)
  const [community, setCommunity] = useState(null)
  const [activeTab, setActiveTab] = useState('feed')
  
  const [posts, setPosts] = useState([])
  const [members, setMembers] = useState([])
  
  const [pageLoading, setPageLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  
  const [showPostModal, setShowPostModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  // State for Gallery
  const [galleryData, setGalleryData] = useState(null) // { images: [], index: 0 }

  const [cachedPosts, setCachedPosts] = useState({
    feed: null,
    job: null,
    portfolio: null
  })
  const [cachedMembers, setCachedMembers] = useState(null)

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      const id = resolvedParams.id
      setCommunityId(id)

      await fetchCommunity(id)
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

  // Polling logic...
  useEffect(() => {
    if (!communityId) return
    const pollInterval = setInterval(() => {
      if (activeTab !== 'members') {
        fetchPosts(communityId, activeTab, true) 
      }
    }, 5000)
    return () => clearInterval(pollInterval)
  }, [communityId, activeTab])

  // Fetch functions...
  const fetchCommunity = async (id) => {
    try {
      const response = await fetch(`/api/communities/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCommunity(data.community)
      }
    } catch (error) { console.error(error) } finally { setPageLoading(false) }
  }

  const fetchPosts = async (id, type, isBackground = false) => {
    if (!isBackground) setPostsLoading(true)
    try {
      let url = `/api/communities/${id}/posts?type=${type}`
      if (type === 'portfolio') {
        const token = getAuthToken()
        if (!token) {
          setPosts([]); setCachedPosts(prev => ({ ...prev, portfolio: [] })); setPostsLoading(false); return
        }
        url = `/api/communities/${id}/posts/my-portfolio`
      }
      const token = getAuthToken()
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const response = await fetch(url, { headers })
      const data = await response.json()
      if (response.ok) {
        setPosts(data.posts)
        setCachedPosts(prev => ({ ...prev, [type]: data.posts }))
      }
    } catch (error) { console.error(error) } finally { if (!isBackground) setPostsLoading(false) }
  }

  const fetchMembers = async (id) => {
    if (cachedMembers) { setMembers(cachedMembers); setPostsLoading(false); return }
    setPostsLoading(true)
    try {
      const response = await fetch(`/api/communities/${id}/members`)
      const data = await response.json()
      if (response.ok) { setMembers(data.members); setCachedMembers(data.members) }
    } catch (error) { console.error(error) } finally { setPostsLoading(false) }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'members') fetchMembers(communityId)
    else {
      if (cachedPosts[tab]) { setPosts(cachedPosts[tab]); setPostsLoading(false) }
      else { setPosts([]); fetchPosts(communityId, tab, false) }
    }
  }

  const handleCreatePost = async (postData) => {
      try {
        const token = getAuthToken()
        const res = await fetch(`/api/communities/${communityId}/posts`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(postData)
        })
        if (res.ok) { setShowPostModal(false); fetchPosts(communityId, activeTab) } 
        else { const errorData = await res.json(); throw new Error(errorData.error || 'Failed to create post') }
      } catch (error) { alert(error.message); throw error }
  }

  const handleLeaveCommunity = async () => {
      if (!confirm('Are you sure you want to leave this community?')) return
      try {
        const token = getAuthToken()
        const response = await fetch(`/api/communities/${communityId}/join`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        if (response.ok) { alert('Left community successfully'); router.push('/communities') }
      } catch (error) { console.error(error) }
  }

  const handleDeletePost = async (postId) => {
      if (!confirm('Delete this post?')) return
      try {
        const token = getAuthToken()
        const response = await fetch(`/api/communities/posts/${postId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        if (response.ok) {
          setPosts(prev => prev.filter(p => p._id !== postId))
          setCachedPosts(prev => ({
            feed: prev.feed?.filter(p => p._id !== postId) || null,
            job: prev.job?.filter(p => p._id !== postId) || null,
            portfolio: prev.portfolio?.filter(p => p._id !== postId) || null
          }))
          alert('Post deleted successfully')
        } 
      } catch (error) { console.error(error) }
  }

  const formatTime = (date) => {
      const now = new Date(); const posted = new Date(date); const diffMs = now - posted; const diffMins = Math.floor(diffMs / 60000); const diffHours = Math.floor(diffMins / 60); const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 1) return 'Just now'; if (diffMins < 60) return `${diffMins}m ago`; if (diffHours < 24) return `${diffHours}h ago`; if (diffDays === 1) return 'Yesterday'; return posted.toLocaleDateString();
  }

  // --- 2. Render Media Preview ---
  const getEmbedPreview = (post) => {
    // 2.1 Handle Images (Array or Single)
    const images = post.imageUrls?.length > 0 
      ? post.imageUrls 
      : (post.imageUrl ? [post.imageUrl] : []);

  if (images.length > 0) {
    // Determine Grid Layout based on count (kept for compatibility but we render the carousel)
    // Use a preview carousel like listing page — clicking image opens full-size gallery
    return (
      <div className="mt-3">
        <ImagePreviewCarousel images={images} onOpen={(i) => setGalleryData({ images, index: i })} />
      </div>
    )
  }

  // 2.2 Handle Embeds (YouTube, etc.)
  const embedUrl = post.embedUrl;
  if (!embedUrl) return null;

  let embedType = post.embedType;

    // YouTube
    if (embedType === 'youtube') {
      const match = embedUrl.match(/(?:v=|v\/|embed\/|youtu.be\/)([^&\n?#]+)/);
      if (match && match[1]) {
        return (
          <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black shadow-inner">
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${match[1]}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="border-0" />
          </div>
        )
      }
    }

    // Embedded Image URL
    if (embedType === 'image') {
      return (
        <div 
          className="mt-3 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
          onClick={() => setGalleryData({ images: [embedUrl], index: 0 })}
        >
          <img src={embedUrl} alt="Shared content" className="w-full h-auto object-contain max-h-[500px]" />
        </div>
      )
    }

    // Video File
    if (embedType === 'video') {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-black">
          <video controls className="w-full h-auto max-h-[500px]" preload="metadata">
            <source src={embedUrl} />
          </video>
        </div>
      )
    }
    
    // Default Link
    return (
      <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block border border-gray-200 rounded-lg p-3 hover:bg-blue-50 transition-colors group">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">🔗</span>
          <div className="flex-1 min-w-0">
             <div className="text-sm text-gray-700 truncate font-medium group-hover:text-blue-600">{embedUrl}</div>
          </div>
        </div>
      </a>
    )
  }

  if (pageLoading || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col pb-nav-safe">
      
      {/* 3. Render Gallery Modal */}
      {galleryData && (
        <ImageGalleryModal 
          images={galleryData.images}
          initialIndex={galleryData.index}
          onClose={() => setGalleryData(null)}
        />
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg safe-top" style={{ zIndex: 50 }}>
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
                <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl ring-1 ring-black/5 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-100" style={{ zIndex: 100 }}>
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
      <div className="bg-white border-b fixed top-[64px] sm:top-[72px] left-0 right-0 shadow-sm" style={{ zIndex: 40 }}>
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
        {postsLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/4"></div></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div><div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : activeTab !== 'members' ? (
          <div className="space-y-4">
            {!posts?.length ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
                <p className="text-gray-600 mb-2 font-medium">No posts found</p>
                <p className="text-gray-500 text-sm">Be the first to share something!</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post._id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
                  
                  {/* Updated Preview Function Call */}
                  {getEmbedPreview(post)}

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

      {showMenu && <div className="fixed inset-0" style={{ zIndex: 30 }} onClick={() => setShowMenu(false)} />}
      {showPostModal && <CreatePostModal onClose={() => setShowPostModal(false)} onSubmit={handleCreatePost} />}
    </div>
  )
}