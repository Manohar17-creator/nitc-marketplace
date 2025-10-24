// app/page.js
'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, User, Home, Tag, Book, Laptop, Ticket, Car, Building, PartyPopper,X} from 'lucide-react'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [cachedListings, setCachedListings] = useState({})

  const categories = [
    { id: 'all', name: 'All', icon: Home, color: 'bg-blue-500' },
    { id: 'lost-found', name: 'Lost & Found', icon: Search, color: 'bg-indigo-500' },
    { id: 'books', name: 'Books & Notes', icon: Book, color: 'bg-green-500' },
    { id: 'electronics', name: 'Electronics', icon: Laptop, color: 'bg-purple-500' },
    { id: 'tickets', name: 'Travel Tickets', icon: Ticket, color: 'bg-orange-500' },
    { id: 'rides', name: 'Ride Sharing', icon: Car, color: 'bg-red-500' },
    { id: 'housing', name: 'PG/Rooms', icon: Building, color: 'bg-yellow-500' },
    { id: 'events', name: 'Event Tickets', icon: PartyPopper, color: 'bg-pink-500' },
    { id: 'misc', name: 'Miscellaneous', icon: Tag, color: 'bg-gray-500' },
  ]

  // Fetch listings on mount and when filters change
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

useEffect(() => {
  const cacheKey = `${selectedCategory}-${searchQuery.trim()}`
  const localCacheKey = `cached_listings_${cacheKey}`

  let foundCache = false

  const loadFromCache = () => {
    // ✅ 1. In-memory cache
    const cached = cachedListings[cacheKey]
    if (cached) {
      setListings(cached)
      foundCache = true
      return true
    }

    // ✅ 2. LocalStorage cache
    const localCached = localStorage.getItem(localCacheKey)
    if (localCached) {
      const { timestamp, listings } = JSON.parse(localCached)
      const isExpired = Date.now() - timestamp > CACHE_TTL
      if (!isExpired) {
        setListings(listings)
        setCachedListings((prev) => ({ ...prev, [cacheKey]: listings }))
        foundCache = true
        return true
      } else {
        localStorage.removeItem(localCacheKey)
      }
    }

    return false
  }

  const cachedFound = loadFromCache()
  if (cachedFound) {
    setLoading(false)
  } else {
    setLoading(true)
  }

  // ✅ Always fetch in background to refresh cache
  const fetchAndUpdate = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/listings?${params}`)
      const data = await response.json()

      if (response.ok && Array.isArray(data.listings)) {
        setListings(data.listings)
        setCachedListings((prev) => ({ ...prev, [cacheKey]: data.listings }))
        localStorage.setItem(
          localCacheKey,
          JSON.stringify({ timestamp: Date.now(), listings: data.listings })
        )
      }
    } catch (err) {
      console.error('Fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  fetchAndUpdate()
}, [selectedCategory, searchQuery])



  const fetchListings = async (cacheKey) => {
  setLoading(true)
  try {
    const params = new URLSearchParams()
    if (selectedCategory !== 'all') params.append('category', selectedCategory)
    if (searchQuery) params.append('search', searchQuery)

    const response = await fetch(`/api/listings?${params}`)
    const data = await response.json()

    if (response.ok) {
      setListings(data.listings)
      
      // ✅ 4. Update in-memory cache
      setCachedListings(prev => ({ ...prev, [cacheKey]: data.listings }))
      
      // ✅ 5. Persist to localStorage (5 min expiry optional)
      const cacheObject = {
        timestamp: Date.now(),
        listings: data.listings
      }
      localStorage.setItem(`cached_listings_${cacheKey}`, JSON.stringify(cacheObject.listings))

      console.log('🛰️ Fetched fresh data:', cacheKey)
    }
  } catch (error) {
    console.error('Failed to fetch listings:', error)
  } finally {
    setLoading(false)
  }
}


  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // If search is cleared, reset to show all
    if (value === '') {
      setSearchQuery('')
    }
  }

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible)
    if (!isSearchVisible) {
      // Focus the search input when showing
      setTimeout(() => {
        document.getElementById('search-input')?.focus()
      }, 100)
    }
  }

  return (
    <div className="bg-gray-50">
      {/* Header - Fixed height to prevent navbar jump */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
  <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px] transition-all duration-300">
    {!isSearchVisible ? (
      <>
        {/* Title */}
        <div className="flex-shrink-0 leading-tight">
          <h1 className="text-lg sm:text-xl font-semibold">NITC Marketplace</h1>
          <p className="text-blue-100 text-xs sm:text-sm">Buy • Sell • Connect</p>
        </div>

        {/* Search Icon */}
        <button
          onClick={toggleSearch}
          className="p-2 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all active:scale-95"
        >
          <Search size={20} className="text-white" />
        </button>
      </>
    ) : (
      /* Expanded Search Input */
      <div className="flex items-center gap-2 w-full transition-all duration-300">
        <button
          onClick={toggleSearch}
          className="p-2 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all active:scale-95"
        >
          <X size={20} className="text-white" />
        </button>

        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200"
            size={16}
          />
          <input
            id="search-input"
            type="text"
            placeholder="Search for anything..."
            value={searchQuery}
            onChange={handleSearch}
            autoFocus
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-blue-500/40 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>
    )}
  </div>
</div>

    <main className="pt-[72px] pb-nav-safe bg-gray-50 min-h-screen">
  {/* Lost/Found Button */}
  <div className="max-w-6xl mx-auto px-4 mt-4 mb-4">
    <Link
      href="/post-lost-found"
      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
    >
      <Search size={20} />
      <span>Lost / Found Something?</span>
    </Link>
  </div>

  {/* Main Content */}
  <div className="max-w-6xl mx-auto px-4">
    {/* Categories */}
    <div className="mb-6">
      <h2 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">
        Categories
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
        {categories.map(cat => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 snap-start flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all min-w-[85px] ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <div
                className={`p-2.5 rounded-full ${
                  selectedCategory === cat.id ? 'bg-blue-500' : cat.color
                }`}
              >
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-center leading-tight px-1">
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>

{/* Listings Section */}
<div className="mb-6 mt-2">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-semibold text-gray-900 text-base sm:text-lg">
      {selectedCategory === 'all'
        ? 'All Listings'
        : categories.find(c => c.id === selectedCategory)?.name || 'Listings'}
      <span className="text-gray-500 font-normal ml-2">
        ({listings?.length ?? 0})
      </span>
    </h2>

    {/* Optional Refresh / Sort */}
    <button
      onClick={fetchListings}
      disabled={loading}
      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 active:scale-95 transition-all"
    >
      ↻ Refresh
    </button>
  </div>

  {/* Loading State */}
  {loading ? (
    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading listings...</p>
    </div>
  ) : !listings || listings.length === 0 ? (
    /* Empty State */
    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="text-5xl mb-3">📦</div>
      <p className="text-gray-700 mb-2 font-medium">No listings found</p>
      <p className="text-gray-500 text-sm mb-4">
        Try another category or post something new!
      </p>
      <Link
        href="/post"
        className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md active:scale-95"
      >
        + Post a Listing
      </Link>
    </div>
  ) : (
    /* Listings Grid */
    <div className="grid gap-4 pb-8 transition-all duration-300">
      {listings.map((listing) => (
        <ListingCard key={listing._id} listing={listing} />
      ))}
    </div>
  )}
</div>
  </div>

  {/* Floating Action Button */}
  <Link href="/post">
    <button
      className="fixed bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
      style={{
        bottom: `calc(72px + env(safe-area-inset-bottom))`,
        right: '16px'
      }}
    >
      <Plus size={24} className="sm:w-7 sm:h-7" />
    </button>
  </Link>
</main>

    </div>
  )
}