// components/ListingCard.js
import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'

export default function ListingCard({ listing }) {
  const getCategoryEmoji = (category) => {
    const emojiMap = {
      books: '📚',
      electronics: '💻',
      tickets: '🎫',
      rides: '🚗',
      housing: '🏠',
      events: '🎉',
      misc: '🎁'
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

    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  return (
    <Link href={`/listing/${listing._id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 border border-gray-200">
        <div className="flex gap-4">
          {/* Image or Emoji */}
          <div className="flex-shrink-0">
            {listing.images && listing.images.length > 0 ? (
              <img 
                src={listing.images[0]} 
                alt={listing.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center text-4xl">
                {getCategoryEmoji(listing.category)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
              {listing.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {listing.description}
            </p>
            
            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-bold text-green-600">
                ₹{listing.price.toLocaleString()}
              </span>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{formatTime(listing.createdAt)}</span>
                </div>
                {listing.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span className="truncate max-w-[100px]">{listing.location}</span>
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