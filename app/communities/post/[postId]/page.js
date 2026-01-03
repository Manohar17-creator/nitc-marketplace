'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'
import { MessageSquare, ChevronLeft, Trash2, Send, X, ChevronRight } from 'lucide-react'

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
      {/* Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img 
          src={images[currentIndex]} 
          alt="Gallery" 
          className="max-w-full max-h-full object-contain select-none"
        />

        {/* Navigation Arrows */}
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

      {/* Close Button */}
      <button onClick={onClose} className="absolute top-6 right-6 text-white p-2 bg-black/40 rounded-full z-[10001]">
        <X size={28} />
      </button>

      {/* Counter */}
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
    e.stopPropagation()
    setIdx(i => (i === 0 ? images.length - 1 : i - 1))
  }
  
  const handleNext = (e) => {
    e.stopPropagation()
    setIdx(i => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="mt-4 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group">
      <div className="relative w-full h-[300px] sm:h-[400px] flex items-center justify-center">
        <img
          src={images[idx]}
          alt="Post Preview"
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => onOpen(idx)}
        />

        {/* Navigation arrows */}
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

export default function PostDetailPage({ params }) {
  const router = useRouter()
  const [postId, setPostId] = useState(null)
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [galleryData, setGalleryData] = useState(null) // { images: [], index: 0 }

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params
      const id = resolvedParams.postId
      setPostId(id)
      await fetchPost(id)
      await fetchComments(id)
    }
    fetchData()

    if (typeof window !== 'undefined') {
      const user = getUserData()
      if (user) setCurrentUserId(user.id)
    }
  }, [params])

  const fetchPost = async (id) => {
    try {
      const response = await fetch(`/api/communities/posts/${id}`)
      const data = await response.json()
      if (response.ok) setPost(data.post)
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (id) => {
    try {
      const response = await fetch(`/api/communities/posts/${id}/comments`)
      const data = await response.json()
      if (response.ok) setComments(data.comments)
    } catch (err) {
      console.error('Fetch comments failed:', err)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    setSubmitting(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`/api/communities/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      })

      if (res.ok) {
        setNewComment('')
        await fetchComments(postId)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/communities/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchComments(postId)
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  // --- 3. Enhanced getEmbedPreview with Image Support ---
  const getEmbedPreview = (post) => {
    // Handle Images (Array or Single)
    const images = post.imageUrls?.length > 0 
      ? post.imageUrls 
      : (post.imageUrl ? [post.imageUrl] : [])

    if (images.length > 0) {
      return (
        <div className="mt-4">
          <ImagePreviewCarousel 
            images={images} 
            onOpen={(i) => setGalleryData({ images, index: i })} 
          />
        </div>
      )
    }

    // Handle Embeds
    const embedUrl = post.embedUrl
    if (!embedUrl) return null

    let embedType = post.embedType

    // YouTube
    if (embedType === 'youtube') {
      const match = embedUrl.match(/(?:v=|v\/|embed\/|youtu.be\/)([^&\n?#]+)/)
      if (match && match[1]) {
        return (
          <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-black shadow-inner">
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

    // Embedded Image URL
    if (embedType === 'image') {
      return (
        <div 
          className="mt-4 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
          onClick={() => setGalleryData({ images: [embedUrl], index: 0 })}
        >
          <img src={embedUrl} alt="Shared content" className="w-full h-auto object-contain max-h-[500px]" />
        </div>
      )
    }

    // Video File
    if (embedType === 'video') {
      return (
        <div className="mt-4 rounded-lg overflow-hidden bg-black">
          <video controls className="w-full h-auto max-h-[500px]" preload="metadata">
            <source src={embedUrl} />
          </video>
        </div>
      )
    }
    
    // Default Link
    return (
      <a 
        href={embedUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-4 block border border-gray-200 rounded-lg p-3 hover:bg-blue-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-600">🔗</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-700 truncate font-medium group-hover:text-blue-600">
              {embedUrl}
            </div>
          </div>
        </div>
      </a>
    )
  }

  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleDateString() === new Date().toLocaleDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString()
  }

  if (loading || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe">
      
      {/* 4. Render Gallery Modal */}
      {galleryData && (
        <ImageGalleryModal 
          images={galleryData.images}
          initialIndex={galleryData.index}
          onClose={() => setGalleryData(null)}
        />
      )}

      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-50 shadow-lg safe-top">
        <div className="max-w-4xl mx-auto h-[64px] sm:h-[72px] flex items-center px-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-white/20 p-2 -ml-2 rounded-full transition-colors active:scale-95"
          >
            <ChevronLeft size={24} />
            <span className="font-medium">Back to Community</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[64px] sm:pt-[72px] pb-6">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          
          {/* 1. Post Content Card */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                {post.authorImage ? (
                  <img 
                    src={post.authorImage} 
                    alt={post.authorName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  post.authorName?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-lg">{post.authorName}</div>
                <div className="text-sm text-gray-500">{formatTime(post.createdAt)}</div>
              </div>
              {post.type && (
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  post.type === 'job' ? 'bg-orange-100 text-orange-700' :
                  post.type === 'portfolio' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {post.type === 'job' ? '💼 Job' : post.type === 'portfolio' ? '⭐ Portfolio' : post.type}
                </span>
              )}
            </div>

            {post.title && <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>}
            <div className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-4">
              {post.content}
            </div>
            
            {/* Render Media Preview */}
            {getEmbedPreview(post)}
          </div>

          {/* 2. Comments Section */}
          <div className="bg-white rounded-lg shadow-md flex flex-col max-h-[550px] w-full">
            
            {/* Fixed Header */}
            <div className="p-4 border-b bg-white rounded-t-lg shrink-0 z-10">
              <h2 className="text-lg font-bold text-gray-900">
                Comments ({comments.length})
              </h2>
            </div>

            {/* Scrollable List */}
            <div className="overflow-y-auto p-0 scrollbar-hide">
              {comments.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare size={48} className="mb-2 opacity-50" />
                  <p>No comments yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {comments.map(comment => (
                    <div key={comment._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {comment.authorName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900 text-sm">{comment.authorName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
                              {currentUserId === comment.authorId?.toString() && (
                                <button 
                                  onClick={() => handleDeleteComment(comment._id)} 
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fixed Input Footer */}
            <div className="p-3 sm:p-4 border-t bg-gray-50 rounded-b-lg shrink-0">
              <form onSubmit={handleSubmitComment} className="flex gap-2 items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
                  You
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}