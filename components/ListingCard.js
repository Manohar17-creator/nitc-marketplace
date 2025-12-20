'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, MapPin } from 'lucide-react'

export default function ListingCard({ listing }) {
  const getCategoryEmoji = (category) => {
    const emojiMap = {
      books: '📚', electronics: '💻', tickets: '🎫', rides: '🚗',
      housing: '🏠', events: '🎉', misc: '🎁', 'lost-found': '🔍'
    }
    return emojiMap[category] || '📦'
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
    return `${diffDays}d ago`
  }

  const getOptimizedUrl = (url) => {
    if (!url || !url.includes('cloudinary')) return url
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_150,h_150,c_fill/')
  }

  return (
    <Link href={`/listing/${listing._id}`}>
      {/* 👇 Rounder Card Container (rounded-xl instead of rounded-lg) */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3 sm:p-4 border border-gray-200 active:scale-[0.98]">
        <div className="flex gap-3 sm:gap-4">
          
          {/* --- LEFT: Image or Icon --- */}
          <div className="flex-shrink-0">
            {listing.images && listing.images.length > 0 ? (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <Image 
                  src={getOptimizedUrl(listing.images[0])}
                  alt={listing.title}
                  fill
                  // 👇 Rounder Image corners to match card
                  className="object-cover rounded-xl"
                  sizes="80px"
                  loading="lazy"
                />
              </div>
            ) : (
              // 👇 Rounder Emoji container
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center text-3xl sm:text-4xl">
                {getCategoryEmoji(listing.category)}
              </div>
            )}
          </div>

          {/* --- RIGHT: Content (Unchanged) --- */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 truncate">
              {listing.title}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
              {listing.description}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              {listing.category === 'lost-found' ? (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold w-fit ${
                  listing.lostFoundType === 'lost'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {listing.lostFoundType === 'lost' ? '😢 LOST' : '😊 FOUND'}
                </span>
              ) : (
                <span className="text-lg sm:text-xl font-bold text-green-600">
                  ₹{listing.price.toLocaleString()}
                </span>
              )}

              <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatTime(listing.createdAt)}</span>
                </div>
                {listing.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span className="truncate max-w-[80px] sm:max-w-[100px]">
                      {listing.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}