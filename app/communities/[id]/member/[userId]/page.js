'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MessageSquare, X, ChevronRight, Briefcase, Star } from 'lucide-react'
import Link from 'next/link'

// --- 1. Full Screen Image Gallery Modal ---
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
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img 
          src={images[currentIndex]} 
          alt="Gallery" 
          className="max-w-full max-h-full object-contain select-none"
        />

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

      <button onClick={onClose} className="absolute top-6 right-6 text-white p-2 bg-black/40 rounded-full z-[10001]">
        <X size={28} />
      </button>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white bg-black/40 px-4 py-1 rounded-full text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}

// --- 2. Small preview carousel ---
function ImagePreviewCarousel({ images, onOpen }) {
  const [idx, setIdx] = useState(0)

  const handlePrev = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIdx(i => (i === 0 ? images.length - 1 : i - 1))
  }
  
  const handleNext = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIdx(i => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group">
      <div className="relative w-full h-48 sm:h-64 flex items-center justify-center">
        <img
          src={images[idx]}
          alt="Post Preview"
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={(e) => {
            e.preventDefault()
            onOpen(idx)
          }}
        />

        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 z-30 pointer-events-none">
            <button
              onClick={handlePrev}
              className="pointer-events-auto bg-black/30 hover:bg-black/60 text-white p-1.5 rounded-full transition backdrop-blur-sm active:scale-90 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="pointer-events-auto bg-black/30 hover:bg-black/60 text-white p-1.5 rounded-full transition backdrop-blur-sm active:scale-90 cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full">
          {images.map((_, i) => (
            <button 
              key={i} 
              onClick={(e) => { 
                e.preventDefault()
                e.stopPropagation()
                setIdx(i) 
              }}
              className={`h-1.5 w-1.5 rounded-full transition-all cursor-pointer ${i === idx ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/80'}`} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MemberPortfolioPage({ params }) {
  const router = useRouter()
  const [communityId, setCommunityId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [member, setMember] = useState(null)
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('feed')
  const [loading, setLoading] = useState(true)
  const [galleryData, setGalleryData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params
      const cId = resolvedParams.id
      const uId = resolvedParams.userId
      setCommunityId(cId)
      setUserId(uId)
      await fetchMemberData(cId, uId, 'feed')
    }
    fetchData()
  }, [params])

  const fetchMemberData = async (cId, uId, type) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/communities/${cId}/member/${uId}?type=${type}`)
      const data = await response.json()
      
      if (response.ok) {
        setMember(data.member)
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to fetch member data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    fetchMemberData(communityId, userId, tab)
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
    return posted.toLocaleDateString()
  }

  // --- 3. Render Media Preview ---
  const getMediaPreview = (post) => {
    const images = post.imageUrls?.length > 0 
      ? post.imageUrls 
      : (post.imageUrl ? [post.imageUrl] : [])

    if (images.length > 0) {
      return (
        <ImagePreviewCarousel 
          images={images} 
          onOpen={(i) => setGalleryData({ images, index: i })} 
        />
      )
    }

    const embedUrl = post.embedUrl
    if (!embedUrl) return null

    let embedType = post.embedType

    if (embedType === 'youtube') {
      const match = embedUrl.match(/(?:v=|v\/|embed\/|youtu.be\/)([^&\n?#]+)/)
      if (match && match[1]) {
        return (
          <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${match[1]}`} 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen 
              className="border-0" 
            />
          </div>
        )
      }
    }

    if (embedType === 'image') {
      return (
        <div 
          className="mt-3 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
          onClick={(e) => {
            e.preventDefault()
            setGalleryData({ images: [embedUrl], index: 0 })
          }}
        >
          <img src={embedUrl} alt="Shared" className="w-full h-auto object-contain max-h-96" />
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-2">Member not found</p>
          <button 
            onClick={() => router.back()} 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col pb-nav-safe">
      
      {/* 4. Render Gallery Modal */}
      {galleryData && (
        <ImageGalleryModal 
          images={galleryData.images}
          initialIndex={galleryData.index}
          onClose={() => setGalleryData(null)}
        />
      )}

      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-50 shadow-lg safe-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 hover:bg-white/20 px-2 py-1 -ml-2 rounded-lg transition-colors active:scale-95"
          >
            <ChevronLeft size={22} />
            <span className="text-sm font-medium">Back to Community</span>
          </button>
          
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Enhanced Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold overflow-hidden border-4 border-white/30 shadow-xl">
                {member.picture ? (
                  <img 
                    src={member.picture} 
                    alt={member.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  member.name?.charAt(0).toUpperCase()
                )}
              </div>
              {/* Online indicator (optional) */}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{member.name}</h1>
              <p className="text-blue-100 text-sm sm:text-base truncate">{member.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white border-b sticky top-[136px] sm:top-[152px] z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => handleTabChange('feed')}
            className={`flex-1 px-4 py-3.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'feed'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Briefcase size={16} />
            Feed Posts
          </button>
          <button
            onClick={() => handleTabChange('portfolio')}
            className={`flex-1 px-4 py-3.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'portfolio'
                ? 'text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Star size={16} />
            Portfolio
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 flex-1 w-full">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            {activeTab === 'feed' ? <Briefcase size={56} className="mx-auto text-gray-300 mb-4" /> : <Star size={56} className="mx-auto text-gray-300 mb-4" />}
            <p className="text-gray-600 font-medium text-lg mb-1">
              No {activeTab === 'feed' ? 'posts' : 'portfolio items'} yet
            </p>
            <p className="text-gray-400 text-sm">
              {activeTab === 'feed' ? 'This member hasn\'t posted anything yet.' : 'No portfolio work to showcase yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <Link
                key={post._id}
                href={`/communities/post/${post._id}`}
                className="block bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                    {post.title || 'Untitled Post'}
                  </h3>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {post.type === 'portfolio' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1">
                        <Star size={12} /> Portfolio
                      </span>
                    )}
                    {post.type === 'job' && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full flex items-center gap-1">
                        💼 Job
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 line-clamp-3 mb-3 leading-relaxed">
                  {post.content}
                </p>

                {/* Media Preview */}
                {getMediaPreview(post)}
                
                <div className="flex items-center gap-5 text-sm text-gray-500 mt-4 pt-3 border-t border-gray-100">
                  <span className="font-medium">{formatTime(post.createdAt)}</span>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MessageSquare size={16} />
                    <span className="font-medium">{post.commentCount || 0} comments</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}