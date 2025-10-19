'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Send, Trash2 } from 'lucide-react'

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

    // Get current user ID
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setCurrentUserId(user.id)
    }
  }, [params])

  const fetchPost = async (id) => {
    try {
      const response = await fetch(`/api/communities/posts/${id}`)
      const data = await response.json()
      
      if (response.ok) {
        setPost(data.post)
      }
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
      
      if (response.ok) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    
    if (!newComment.trim()) return

    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/communities/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        setNewComment('')
        await fetchComments(postId)
        await fetchPost(postId) // Refresh to update comment count
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchComments(postId)
        await fetchPost(postId)
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
          className="mt-4 block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
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
        className="mt-4 block text-blue-600 hover:text-blue-700 text-sm break-all"
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

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return posted.toLocaleDateString()
  }

  if (loading || !post) {
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
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:opacity-80 active:scale-95 transition"
          >
            <ChevronLeft size={22} />
            <span className="text-sm">Back to Community</span>
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-4xl mx-auto p-4 flex-1 w-full pb-24">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md mb-4">
          {/* Post Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {post.authorName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-lg">{post.authorName}</div>
              <div className="text-sm text-gray-500">{formatTime(post.createdAt)}</div>
            </div>
            {post.type === 'job' && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                💼 Job
              </span>
            )}
            {post.type === 'showcase' && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                ⭐ Showcase
              </span>
            )}
          </div>

          {/* Post Title */}
          {post.title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
          )}

          {/* Post Content */}
          <div className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-4">
            {post.content}
          </div>

          {/* Embed */}
          {post.embedUrl && getEmbedPreview(post.embedUrl, post.embedType)}

          {/* Stats */}
          <div className="mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {post.commentCount || 0} {post.commentCount === 1 ? 'comment' : 'comments'}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">
              Comments ({comments.length})
            </h2>
          </div>

          {/* Comments List */}
          <div className="divide-y">
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No comments yet</p>
                <p className="text-sm mt-1">Be the first to comment!</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.authorName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-900 text-sm">
                          {comment.authorName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(comment.createdAt)}
                          </span>
                          {currentUserId === comment.authorId.toString() && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comment Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              <span className="hidden sm:inline">Post</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}