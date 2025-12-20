'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Home, Book, Laptop, Ticket, Car, Building, PartyPopper, Tag, X } from 'lucide-react'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import NotificationBell from '@/components/NotificationBell'
import AdCard from '@/components/AdCard'          // 👈 Import Local Ad Component
import AdSenseBanner from '@/components/AdSenseBanner' // 👈 Import Google Ad Component

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState([])
  const [ads, setAds] = useState([]) // 👈 New State for Ads
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

  // --- Caching & Fetching Logic ---
  const CACHE_TTL = 5 * 60 * 1000

  useEffect(() => {
    const cacheKey = `${selectedCategory}-${searchQuery.trim()}`
    const localCacheKey = `cached_listings_${cacheKey}`

    // 1. Fetch Listings (Existing Logic)
    const loadListings = async () => {
      // Check Cache First
      if (cachedListings[cacheKey]) {
        setListings(cachedListings[cacheKey])
        setLoading(false)
        return
      }
      
      // Check LocalStorage
      const localCached = localStorage.getItem(localCacheKey)
      if (localCached) {
        const { timestamp, listings } = JSON.parse(localCached)
        if (Date.now() - timestamp < CACHE_TTL) {
          setListings(listings)
          setCachedListings(prev => ({ ...prev, [cacheKey]: listings }))
          setLoading(false)
          return
        } else {
          localStorage.removeItem(localCacheKey)
        }
      }

      // Fetch from API
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== 'all') params.append('category', selectedCategory)
        if (searchQuery) params.append('search', searchQuery)

        const response = await fetch(`/api/listings?${params}`)
        const data = await response.json()

        if (response.ok && Array.isArray(data.listings)) {
          setListings(data.listings)
          setCachedListings(prev => ({ ...prev, [cacheKey]: data.listings }))
          localStorage.setItem(localCacheKey, JSON.stringify({ 
            timestamp: Date.now(), 
            listings: data.listings 
          }))
        }
      } catch (err) {
        console.error('Fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }

    // 2. Fetch Ads (New Logic)
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads')
        if (res.ok) {
          const data = await res.json()
          setAds(data.ads || [])
        }
      } catch (e) {
        console.error("Failed to load ads", e)
      }
    }

    loadListings()
    fetchAds() // 👈 Trigger Ad Fetch

  }, [selectedCategory, searchQuery])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)

      const [resListings, resAds] = await Promise.all([
        fetch(`/api/listings?${params}`),
        fetch('/api/ads')
      ])

      if (resListings.ok) {
        const data = await resListings.json()
        setListings(data.listings)
        // Update Cache
        const cacheKey = `${selectedCategory}-${searchQuery.trim()}`
        const localCacheKey = `cached_listings_${cacheKey}`
        setCachedListings(prev => ({ ...prev, [cacheKey]: data.listings }))
        localStorage.setItem(localCacheKey, JSON.stringify({ 
          timestamp: Date.now(), 
          listings: data.listings 
        }))
      }

      if (resAds.ok) {
        const data = await resAds.json()
        setAds(data.ads || [])
      }

    } finally {
      setLoading(false)
    }
  }

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible)
    if (!isSearchVisible) {
      setTimeout(() => document.getElementById('search-input')?.focus(), 100)
    }
  }

  // 👇 RENDER LOGIC: Mix Listings and Ads
  const renderContent = () => {
    if (loading && listings.length === 0) return <div className="text-center py-10">Loading...</div>
    if (listings.length === 0) return <div className="text-center py-10">No listings</div>

    const mixedContent = []
    
    // 1. Filter only LOCAL ads from the fetched ads
    const localAds = ads.filter(ad => ad.type === 'local')
    
    let localAdIndex = 0

    listings.forEach((listing, index) => {
      mixedContent.push({ type: 'listing', data: listing })
      
      // Inject Ad after every 3rd listing (3, 6, 9...)
      if ((index + 1) % 3 === 0) {
        
        // 🎯 PRIORITY RULE:
        // 1. Is there a unique Local Ad we haven't shown yet?
        if (localAdIndex < localAds.length) {
          // Yes, show Local Ad
          mixedContent.push({ type: 'local_ad', data: localAds[localAdIndex] })
          localAdIndex++ // Move to next local ad
        } else {
          // No more unique local ads -> Show Online Ad (Google)
          mixedContent.push({ type: 'google_ad', data: null })
        }
      }
    })

    return (
      <div className="grid gap-4 pb-8 transition-all duration-300">
        {mixedContent.map((item, i) => {
          if (item.type === 'listing') return <ListingCard key={item.data._id} listing={item.data} />
          
          if (item.type === 'local_ad') return <AdCard key={`local-ad-${i}`} ad={item.data} />
          
          if (item.type === 'google_ad') return <AdSenseBanner key={`google-ad-${i}`} dataAdSlot="YOUR_REAL_SLOT_ID" />
        })}
      </div>
    )
  }


  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* --- Fixed Header --- */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px] transition-all duration-300">
          {!isSearchVisible ? (
            <>
              <div className="flex-shrink-0 leading-tight">
                <h1 className="text-lg sm:text-xl font-semibold">Unyfy</h1>
                <p className="text-blue-100 text-xs sm:text-sm">Where campus comes together</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSearch}
                  className="p-2 hover:bg-blue-700 active:bg-blue-800 rounded-full transition-all active:scale-95"
                >
                  <Search size={20} className="text-white" />
                </button>
                <NotificationBell />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full transition-all duration-300">
              <button onClick={toggleSearch} className="p-2 hover:bg-blue-700 rounded-full">
                <X size={20} className="text-white" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={16} />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-blue-500/40 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="pt-[72px] pb-24 bg-gray-50">
        
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Post Lost/Found Button */}
          <div className="mt-4 mb-4">
            <Link
              href="/post-lost-found"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-800 transition-all shadow-md active:scale-[0.98]"
            >
              <Search size={20} />
              <span>Lost / Found Something?</span>
            </Link>
          </div>
          
          {/* Categories */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">Categories</h2>
            <div className="flex gap-3 overflow-x-auto py-4 -my-4 px-1 scrollbar-hide snap-x snap-mandatory">
              {categories.map(cat => {
                const Icon = cat.icon
                const isSelected = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 snap-start flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all min-w-[85px] border ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg scale-105 border-blue-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border-transparent'
                    }`}
                  >
                    <div className={`p-2.5 rounded-full ${isSelected ? 'bg-white/20' : cat.color}`}>
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

          {/* Listings List (Mixed with Ads) */}
          <div className="mb-6 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-base sm:text-lg">
                {selectedCategory === 'all' ? 'All Listings' : categories.find(c => c.id === selectedCategory)?.name}
                <span className="text-gray-500 font-normal ml-2">({listings?.length ?? 0})</span>
              </h2>
              <button onClick={handleRefresh} disabled={loading} className="text-sm text-blue-600 font-medium active:scale-95">
                ↻ Refresh
              </button>
            </div>

            {/* 👇 THIS RENDERS THE ADS + LISTINGS */}
            {renderContent()}

          </div>
        
        </div>

        {/* FAB */}
        <Link href="/post">
          <button 
            className="fixed right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 z-40"
            style={{ bottom: '90px' }}
          >
            <Plus size={24} className="sm:w-7 sm:h-7" />
          </button>
        </Link>

      </main>
    </div>
  )
}