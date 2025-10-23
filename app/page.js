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
  useEffect(() => {
    // Check cache first for instant display
    const cacheKey = `${selectedCategory}-${searchQuery}`
    if (cachedListings[cacheKey]) {
      setListings(cachedListings[cacheKey])
    }
    
    fetchListings()
  }, [selectedCategory, searchQuery])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/listings?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setListings(data.listings)
        // Cache the data
        const cacheKey = `${selectedCategory}-${searchQuery}`
        setCachedListings(prev => ({ ...prev, [cacheKey]: data.listings }))
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
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 z-20 shadow-lg safe-top">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 h-[48px]">
            {!isSearchVisible ? (
              <>
                <div className="flex-shrink-0">
                  <h1 className="text-2xl sm:text-3xl font-bold">NITC Marketplace</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSearch}
                    className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Search size={22} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={toggleSearch}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <X size={22} />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search for anything..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-blue-500/50 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 sm:pt-20 pb-nav-safe">
        {/* Lost/Found Button */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="mt-4 mb-2">
            <Link
              href="/post-lost-found"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <Search size={20} />
              <span>Lost / Found Something?</span>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4">
          {/* Categories */}
          <div className="mb-6 px-1">
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
                    <div className={`p-2.5 rounded-full ${selectedCategory === cat.id ? 'bg-blue-500' : cat.color}`}>
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

          {/* Listings */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {selectedCategory === 'all' ? 'All Listings' : categories.find(c => c.id === selectedCategory)?.name}
              <span className="text-gray-500 font-normal ml-2">({listings.length})</span>
            </h2>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600 mb-4">No listings found</p>
              <Link href="/post" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Post the first listing
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 pb-8">
              {listings.map(listing => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button - Positioned above navbar */}
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
    </div>
  )
}