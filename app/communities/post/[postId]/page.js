'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUser } from '@/lib/auth-utils'
import { MessageSquare, ChevronLeft, Trash2, Send } from 'lucide-react'

export default function PostDetailPage({ params }) {
  const router = useRouter()
  const [postId, setPostId] = useState(null)
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

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
      const user = getStoredUser()
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

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    setSubmitting(true)
    try {
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
      const token = localStorage.getItem('token')
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

  const getEmbedPreview = (embedUrl, embedType) => {
    if (!embedUrl) return null
    if (embedType === 'youtube') {
      const videoId = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      if (videoId) {
        return (
          <div className="mt-4 aspect-video rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allowFullScreen
            />
          </div>
        )
      }
    }
    return <a href={embedUrl} target="_blank" className="mt-4 block text-blue-600 truncate">{embedUrl}</a>
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
      
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:opacity-80 active:scale-95 transition"
          >
            <ChevronLeft size={22} />
            <span className="text-sm">Back to Community</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[64px] sm:pt-[72px] pb-6">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          
          {/* 1. Post Content Card */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {post.authorName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-lg">{post.authorName}</div>
                <div className="text-sm text-gray-500">{formatTime(post.createdAt)}</div>
              </div>
              {post.type && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                  {post.type}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
            <div className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-4">
              {post.content}
            </div>
            {post.embedUrl && getEmbedPreview(post.embedUrl, post.embedType)}
          </div>

          {/* 2. Instagram-Style Comments Box (FIXED GAP) */}
          {/* 👇 Changed h-[65vh] to max-h-[70vh]. This allows it to shrink when empty! */}
          {/* 2. Instagram-Style Comments Box (Fixed Gap & Scrolling) */}
          {/* 👇 Change 1: Use 'max-h-[550px]' instead of fixed height. This lets it shrink! */}
          <div className="bg-white rounded-lg shadow-md flex flex-col max-h-[550px] w-full">
            
            {/* A. Fixed Header */}
            <div className="p-4 border-b bg-white rounded-t-lg shrink-0 z-10">
              <h2 className="text-lg font-bold text-gray-900">
                Comments ({comments.length})
              </h2>
            </div>

            {/* B. Scrollable List */}
            {/* 👇 Change 2: Removed 'flex-1'. Added 'overflow-y-auto'. 
                Now it only takes necessary space, but scrolls if it gets too tall. */}
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
                                <button onClick={() => handleDeleteComment(comment._id)} className="text-red-400 hover:text-red-600">
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

            {/* C. Fixed Input Footer */}
            {/* 👇 Change 3: 'shrink-0' ensures this never gets squished or pushed off screen */}
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