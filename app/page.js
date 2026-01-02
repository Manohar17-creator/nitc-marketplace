'use client'
import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Home, Book, Laptop, Ticket, Car, Building, PartyPopper, Tag, X, Download } from 'lucide-react'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'
import NotificationBell from '@/components/NotificationBell'
import AdCard from '@/components/AdCard'
import { app } from '@/lib/firebase'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [listings, setListings] = useState([])
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearchVisible, setIsSearchVisible] = useState(false)

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallVisible, setIsInstallVisible] = useState(false)

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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setIsInstallVisible(false)
  }

  // ✅ FIX: Reduce cache duration to 5 seconds to ensure freshness
  const CACHE_DURATION = 5 * 1000 
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300) 
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadData()
  }, [selectedCategory, debouncedSearch])

  const loadData = async () => {
    const cacheKey = `listings_${selectedCategory}_${debouncedSearch}`
    const cached = getCachedData(cacheKey)
    
    if (cached) {
      setListings(cached.listings)
      setAds(cached.ads || [])
      setLoading(false)
      
      // ✅ FIX: Always fetch in background to catch new posts immediately
      fetchDataInBackground(cacheKey)
      return
    }
    
    await fetchData(cacheKey)
  }

  const fetchData = async (cacheKey) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (debouncedSearch) params.append('search', debouncedSearch)

      // ✅ FIX: Use 'no-store' and timestamp to bust cache
      const t = Date.now()
      const [listingsRes, adsRes] = await Promise.all([
        fetch(`/api/listings?${params}&t=${t}`, { cache: 'no-store' }),
        fetch(`/api/ads?t=${t}`, { cache: 'no-store' })
      ])

      const [listingsData, adsData] = await Promise.all([
        listingsRes.json(),
        adsRes.json()
      ])

      const newListings = listingsData.listings || []
      const newAds = adsData.ads || []

      setListings(newListings)
      setAds(newAds)

      setCachedData(cacheKey, { listings: newListings, ads: newAds, timestamp: Date.now() })

    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDataInBackground = async (cacheKey) => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (debouncedSearch) params.append('search', debouncedSearch)

      // ✅ FIX: Use 'no-store' here too
      const t = Date.now()
      const [listingsRes, adsRes] = await Promise.all([
        fetch(`/api/listings?${params}&t=${t}`, { cache: 'no-store' }),
        fetch(`/api/ads?t=${t}`, { cache: 'no-store' })
      ])

      const [listingsData, adsData] = await Promise.all([
        listingsRes.json(),
        adsRes.json()
      ])
      
      const newListings = listingsData.listings || []
      
      // Only update state if data actually changed to prevent flickering
      if (JSON.stringify(newListings) !== JSON.stringify(listings)) {
        setListings(newListings)
        setAds(adsData.ads || [])
        setCachedData(cacheKey, { 
          listings: newListings, 
          ads: adsData.ads || [], 
          timestamp: Date.now() 
        })
      }
    } catch (error) {
      console.error('Background fetch failed:', error)
    }
  }

  const getCachedData = (key) => {
    try {
      const cached = localStorage.getItem(key)
      if (!cached) return null
      const data = JSON.parse(cached)
      // Allow using slightly older cache for instant render, but background fetch will update it
      return data
    } catch {
      return null
    }
  }

  const setCachedData = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      // If quota exceeded, clear old items
      localStorage.clear()
    }
  }

  const handleRefresh = () => {
    const cacheKey = `listings_${selectedCategory}_${debouncedSearch}`
    localStorage.removeItem(cacheKey)
    fetchData(cacheKey)
  }

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible)
    if (!isSearchVisible) {
      setTimeout(() => document.getElementById('search-input')?.focus(), 100)
    } else {
      setSearchQuery('')
    }
  }

  const renderContent = () => {
    if (loading && listings.length === 0) {
      return (
        <div className="grid gap-4 pb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
              <div className="flex gap-3 p-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (listings.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <div className="mb-3">
            <Home size={48} className="mx-auto text-gray-300" />
          </div>
          <p className="text-lg font-medium">No listings found</p>
          <p className="text-sm">Try changing the category or search term</p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 pb-8 transition-all duration-300">
        {listings.map((listing) => (
          <ListingCard key={listing._id} listing={listing} />
        ))}
      </div>
    )
  }

  const topAd = useMemo(() => {
    if (ads.length === 0) return null
    return ads[0] 
  }, [ads])

  return (
    <div className="bg-gray-50 min-h-screen">
      
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
          
          {isInstallVisible && (
            <div className="mt-4 mb-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 text-white shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Download size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Install Unyfy App</h3>
                  <p className="text-xs text-gray-300">Add to Home Screen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => setIsInstallVisible(false)} className="p-2 text-gray-400 hover:text-white"><X size={18} /></button>
                <button onClick={handleInstallClick} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Install</button>
              </div>
            </div>
          )}

          {topAd && <div className="mt-4 mb-4"><AdCard ad={topAd} /></div>}

          <div className="mt-4 mb-4">
            <Link
              href="/post-lost-found"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-800 transition-all shadow-md active:scale-[0.98]"
            >
              <Search size={20} />
              <span>Lost / Found Something?</span>
            </Link>
          </div>
          
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
                    className={`flex-shrink-0 snap-start flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all min-w-[85px] border ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-105 border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border-transparent'}`}
                  >
                    <div className={`p-2.5 rounded-full ${isSelected ? 'bg-white/20' : cat.color}`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight px-1">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mb-6 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-base sm:text-lg">
                {selectedCategory === 'all' ? 'All Listings' : categories.find(c => c.id === selectedCategory)?.name}
                <span className="text-gray-500 font-normal ml-2">({listings?.length ?? 0})</span>
              </h2>
              <button onClick={handleRefresh} disabled={loading} className="text-sm text-blue-600 font-medium active:scale-95 disabled:opacity-50">↻ Refresh</button>
            </div>
            {renderContent()}
          </div>
        </div>

        <Link href="/post">
          <button className="fixed right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 z-40 transition-all active:scale-[0.98]" style={{ bottom: 'calc(90px + env(safe-area-inset-bottom))' }}>
            <Plus size={24} className="sm:w-7 sm:h-7" />
          </button>
        </Link>
      </main>
    </div>
  )
}