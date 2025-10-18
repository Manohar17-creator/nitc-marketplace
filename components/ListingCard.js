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

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  return (
    <Link href={`/listing/${listing._id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3 sm:p-4 border border-gray-200 active:scale-[0.98]">
        <div className="flex gap-3 sm:gap-4">
          {/* Image or Emoji */}
          <div className="flex-shrink-0">
            {listing.images && listing.images.length > 0 ? (
              <img 
                src={listing.images[0]} 
                alt={listing.title}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center text-3xl sm:text-4xl">
                {getCategoryEmoji(listing.category)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Lost/Found Badge */}
            {listing.category === 'lost-found' && (
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${
                listing.lostFoundType === 'lost'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {listing.lostFoundType === 'lost' ? '😢 LOST' : '😊 FOUND'}
              </span>
            )}

            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 truncate">
              {listing.title}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
              {listing.description}
            </p>
            
            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              {listing.category === 'lost-found' ? (
                <div>
                  {listing.reward > 0 && (
                    <span className="text-base sm:text-lg font-bold text-orange-600">
                      🎁 ₹{listing.reward.toLocaleString()} Reward
                    </span>
                  )}
                  {listing.reward === 0 && (
                    <span className="text-sm text-gray-600 font-medium">
                      {listing.lostFoundType === 'lost' ? 'Help me find it!' : 'Claim your item'}
                    </span>
                  )}
                </div>
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
                    <span className="truncate max-w-[80px] sm:max-w-[100px]">{listing.location}</span>
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