// app/page.js
'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, User, Home, Tag, Book, Laptop, Ticket, Car, Building, PartyPopper, Menu, X } from 'lucide-react'
import Link from 'next/link'
import ListingCard from '@/components/ListingCard'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  const categories = [
    { id: 'all', name: 'All', icon: Home, color: 'bg-blue-500' },
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
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Better mobile spacing */}
<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg">
  <div className="max-w-6xl mx-auto">
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">NITC Marketplace</h1>
        <p className="text-blue-100 text-xs sm:text-sm">Buy, Sell & Share</p>
      </div>
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
      >
        {showMenu ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
    {/* Search bar here */}
  </div>
</div>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className="bg-white border-b shadow-lg p-4">
          <div className="max-w-6xl mx-auto space-y-2">
            <Link href="/profile" className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3">
              <User size={20} />
              <span>My Profile</span>
            </Link>
            
            <Link href="/profile?tab=listings" className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3">
              <Tag size={20} />
              <span>My Listings</span>
            </Link>
            <button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                }
                window.location.href = '/login'
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3 text-red-600"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        {/* Categories - Better mobile scroll */}
      <div className="mb-6">
        <h2 className="font-semibold text-gray-900 mb-3 px-1">Categories</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 snap-start flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-[80px] ${
                  selectedCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-full ${selectedCategory === cat.id ? 'bg-blue-500' : cat.color}`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
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
          <div className="grid gap-4 mb-20">
            {listings.map(listing => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button - Better mobile positioning */}
      <Link href="/post">
        <button className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50">
          <Plus size={24} className="sm:w-7 sm:h-7" />
        </button>
      </Link>
    </div>
  )
}