'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function MemberPortfolioPage({ params }) {
  const router = useRouter()
  const [communityId, setCommunityId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [member, setMember] = useState(null)
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('feed') // ← ADD THIS
  const [loading, setLoading] = useState(true)

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
    const posted = new Date(date)
    return posted.toLocaleDateString()
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
        <p className="text-gray-600">Member not found</p>
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
            className="flex items-center gap-2 mb-3 hover:opacity-80 active:scale-95 transition"
          >
            <ChevronLeft size={22} />
            <span className="text-sm">Back</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {member.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{member.name}</h1>
              <p className="text-blue-100 text-sm">{member.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[120px] z-10">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => handleTabChange('feed')}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'feed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Feed Posts
          </button>
          <button
            onClick={() => handleTabChange('portfolio')}
            className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'portfolio'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Portfolio
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 flex-1 w-full pb-8">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No {activeTab === 'feed' ? 'posts' : 'portfolio items'} yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <Link
                key={post._id}
                href={`/communities/post/${post._id}`}
                className="block bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {post.title || 'Post'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {post.type === 'portfolio' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        Portfolio
                      </span>
                    )}
                    {post.type === 'job' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        Job
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 line-clamp-3 mb-3">
                  {post.content}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{formatTime(post.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    <span>{post.commentCount || 0}</span>
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