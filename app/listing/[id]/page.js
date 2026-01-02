'use client'
// 👇 1. Import 'use' from React
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Phone, Mail, MapPin, Clock, User, Share2, Calendar } from 'lucide-react'

export default function ListingDetail({ params }) {
  // 👇 2. Unwrap params using React.use()
  const { id } = use(params)
  
  const router = useRouter()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (id) {
      fetchListing()
    }
  }, [id]) // 👈 Use the unwrapped 'id' here

  const fetchListing = async () => {
    try {
      // 👈 Use 'id' in the fetch URL
      const response = await fetch(`/api/listings/${id}`)
      const data = await response.json()
      
      if (response.ok) {
        setListing(data.listing)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

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

    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this listing: ${listing.title}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share failed:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!listing) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe">
      {/* Header */}
      {/* 1. Spacer for Detail Page */}


      {/* 2. Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-50 shadow-lg safe-top">
        <div className="max-w-4xl mx-auto h-[64px] sm:h-[72px] flex items-center justify-between px-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-white/20 px-3 py-1.5 -ml-2 rounded-full transition-colors active:scale-95"
          >
            <ChevronLeft size={24} />
            <span className="text-sm sm:text-base font-medium">Back</span>
          </button>
          
          <button
            onClick={handleShare}
            className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-[64px] sm:h-[72px]" />

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          
          {/* 👇 3. FIXED IMAGE LOGIC: Show Emoji if no images */}
          <div className="relative overflow-hidden bg-gray-100">
            {listing.images && listing.images.length > 0 ? (
              // Case A: Show Image Slider
              <>
                <div className="relative h-96 w-full">
                  <img
                    src={listing.images[selectedImage]}
                    alt={listing.title}
                    className="w-full h-full object-contain bg-black/5"
                  />
                </div>

                {/* Navigation Arrows */}
                {listing.images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-3 z-30 pointer-events-none">
                    <button
                      onClick={() => setSelectedImage(selectedImage === 0 ? listing.images.length - 1 : selectedImage - 1)}
                      className="pointer-events-auto bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition backdrop-blur-sm"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setSelectedImage(selectedImage === listing.images.length - 1 ? 0 : selectedImage + 1)}
                      className="pointer-events-auto bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition backdrop-blur-sm"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Case B: Show Big Emoji Placeholder (Like Home Page)
              <div className="h-64 sm:h-80 w-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <span className="text-8xl sm:text-9xl filter drop-shadow-sm">
                  {getCategoryEmoji(listing.category)}
                </span>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto p-3 sm:p-4">
            {/* Content */}
            <div className="px-1">
              {/* Title & Time */}
              <div className="mb-4 sm:mb-5">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{formatTime(listing.createdAt)}</span>
                  </div>
                  {listing.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span>{listing.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price or Lost/Found Info */}
              {/* Inside ListingDetail component, price/reward section */}
{listing.category === 'lost-found' ? (
  <div className={`border-l-4 p-5 sm:p-6 mb-5 sm:mb-6 rounded-r-lg ${
    listing.lostFoundType === 'lost' ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
  }`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-3xl">{listing.lostFoundType === 'lost' ? '😢' : '😊'}</span>
      <div>
        <div className={`text-sm font-medium ${listing.lostFoundType === 'lost' ? 'text-red-700' : 'text-green-700'}`}>
          {listing.lostFoundType === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}
        </div>
        <div className={`text-2xl sm:text-3xl font-bold ${listing.lostFoundType === 'lost' ? 'text-red-700' : 'text-green-700'}`}>
          {listing.lostFoundType === 'lost' ? 'Help Me Find It!' : 'Claim Your Item'}
        </div>
      </div>
    </div>
    
    {/* ✅ FIX: Improved Reward Display Logic */}
    {listing.category === 'lost-found' && Number(listing.reward) > 0 && (
      <div className="mt-3 p-3 bg-orange-100 rounded-lg border border-orange-200">
        <div className="text-xs text-orange-700 font-bold uppercase tracking-wider mb-1">Reward for Return</div>
        <div className="text-2xl font-bold text-orange-700 flex items-center gap-2">
          🎁 ₹{Number(listing.reward).toLocaleString('en-IN')}
        </div>
      </div>
    )}
  </div>
) : (
  <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-lg">
    <div className="text-sm text-green-700 mb-1 font-medium">Price</div>
    <div className="text-4xl font-bold text-green-700">₹{listing.price.toLocaleString('en-IN')}</div>
  </div>
)}

              {/* Last Seen Info */}
              {listing.category === 'lost-found' && (
                <div className="mb-5 sm:mb-6 px-1">
                  <h2 className="font-semibold text-gray-900 text-lg sm:text-xl mb-3">
                    Last Seen Information
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin size={20} className="text-gray-500" />
                      <span className="font-medium">{listing.lastSeenLocation || listing.location}</span>
                    </div>
                    {listing.lastSeenDate && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={20} className="text-gray-500" />
                        <span>{new Date(listing.lastSeenDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-5 sm:mb-6 px-1">
                <h2 className="font-semibold text-gray-900 text-lg sm:text-xl mb-3">Description</h2>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>

              <hr className="my-6 border-gray-200" />

              {/* Category Tag */}
              <div className="mb-5 sm:mb-6 pb-5 sm:pb-6 border-b px-1">
                <h2 className="font-semibold text-gray-900 text-lg sm:text-xl mb-3">
                  Category
                </h2>
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {getCategoryEmoji(listing.category)} {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                </span>
              </div>

              {/* Seller Information */}
              <div>
                <h2 className="font-semibold text-gray-900 text-lg mb-4">Seller Information</h2>
                {/* Replace the Seller Information section in your ListingDetail component */}
<div className="bg-gray-50 rounded-lg p-4 space-y-4">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-blue-100 rounded-full">
      <User size={24} className="text-blue-600" />
    </div>
    <div>
      <div className="text-sm text-gray-600">Seller</div>
      <div className="font-semibold text-gray-900">{listing.sellerName}</div>
    </div>
  </div>

  {/* ✅ Added a check to hide or show "Not Provided" if number is missing */}
  {listing.sellerPhone ? (
    <a 
      href={`tel:${listing.sellerPhone}`}
      className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-gray-200"
    >
      <div className="p-2 bg-blue-100 rounded-full">
        <Phone size={20} className="text-blue-600" />
      </div>
      <div>
        <div className="text-sm text-gray-600">Phone</div>
        <div className="font-medium text-blue-600">{listing.sellerPhone}</div>
      </div>
    </a>
  ) : (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 opacity-60">
       <div className="p-2 bg-gray-100 rounded-full">
        <Phone size={20} className="text-gray-400" />
      </div>
      <div className="text-sm text-gray-500 italic">Phone number not provided</div>
    </div>
  )}

  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
    <div className="p-2 bg-gray-100 rounded-full">
      <Mail size={20} className="text-gray-600" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm text-gray-600">Email</div>
      <div className="font-medium text-gray-700 truncate">{listing.sellerEmail}</div>
    </div>
  </div>
</div>

                {/* Contact Button */}
                <a
                  href={`tel:${listing.sellerPhone}`}
                  className="block w-full mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-lg font-semibold text-center hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-sm sm:text-base"
                >
                  📞 Contact Seller
                </a>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Safety Tips</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Meet in public places on campus</li>
              <li>• Check the item before making payment</li>
              <li>• Do not share sensitive personal information</li>
              <li>• Report suspicious listings to admins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}