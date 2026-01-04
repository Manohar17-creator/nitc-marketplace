'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Calendar as CalIcon, Plus, Flag, Trash2, Heart, Search, Calendar, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AdCard from '@/components/AdCard'
import Image from 'next/image'
import { app } from '@/lib/firebase'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'
import { Edit3 } from 'lucide-react'
import { getMessaging, getToken } from 'firebase/messaging'

// Helper for "Read More"
function EventDescription({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (!text || text.length < 100) return <p className="text-sm text-gray-700 mb-4 leading-relaxed">{text}</p>
  return (
    <div className="mb-4">
      <p className={`text-sm text-gray-700 leading-relaxed transition-all ${expanded ? '' : 'line-clamp-3'}`}>{text}</p>
      <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }} className="text-blue-600 text-xs font-bold mt-1 hover:underline focus:outline-none">
        {expanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  )
}

// Full-screen Image Modal
// Full-screen Image Modal (FIXED for laptops/desktop)
function ImageModal({ imageUrl, onClose, title }) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div 
      // Added safe-area-inset handling for mobile browsers with bottom bars
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 pb-[env(safe-area-inset-bottom,1rem)]"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        // Increased z-index to ensure it's always on top
        className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors z-20"
      >
        <X size={24} />
      </button>
      
      {/* FIXED CONTAINER:
         1. Removed 'max-w-4xl max-h-[90vh] w-full'.
         2. Added flex centering so the container shrink-wraps the image.
         3. Added onClick stopPropagation here.
      */}
      <div 
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt={title}
          // FIXED IMAGE STYLES:
          // 1. Removed 'w-full h-full'.
          // 2. Added max-w and max-h calc(). This constrains the image to the viewport size
          //    minus the 2rem (p-4) padding of the parent, ensuring it never overflows.
          className="object-contain rounded-lg max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
        />
        {title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg z-10">
            <p className="text-white font-semibold text-center">{title}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EventsPage() {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const handleEdit = (event) => {
  // Option 1: Navigate to the create page with the event ID to reuse the form
  router.push(`/events/create?edit=${event._id}`)
}
  const router = useRouter()

  const CACHE_KEY = 'events_feed_cache'

  useEffect(() => {
    // 1. User Setup
    const token = getAuthToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUser(payload)
      } catch (e) {}
    }

    // 2. Load from Cache IMMEDIATELY (Instant Navigation)
    const cachedData = localStorage.getItem(CACHE_KEY)
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        setFeed(parsed)
        setLoading(false) // Show cached content instantly
      } catch (e) {
        console.error('Cache parse error', e)
      }
    }

    // 3. Fetch Fresh Data (Background Update)
    const hasCache = !!cachedData
    fetchEvents(!hasCache) 

    // 4. Polling (Keep existing logic)
    const interval = setInterval(() => {
      fetchEvents(true) // Silent refresh
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchEvents = async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    
    try {
      const res = await fetch(`/api/events?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.feed) {
          setFeed(data.feed)
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.feed))
        }
      }
    } catch (error) { 
      console.error(error) 
    } finally { 
      if (showSpinner) setLoading(false) 
    }
  }

  const handleInterest = async (eventId, index) => {
  const token = getAuthToken()
  if (!token) return router.push('/auth/login')

  // Optimistic Update
  const newFeed = [...feed]
  const item = newFeed[index]
  if (item.type !== 'event') return

  const event = item.data
  // Ensure we are checking against the correct field name (userId)
  const isCurrentlyInterested = event.interested?.includes(currentUser?.userId)
  
  if (isCurrentlyInterested) {
    event.interested = event.interested.filter(id => id !== currentUser.userId)
  } else {
    if (!event.interested) event.interested = []
    event.interested.push(currentUser.userId)
  }
  
  setFeed(newFeed)
  localStorage.setItem(CACHE_KEY, JSON.stringify(newFeed))

  try {
    const res = await fetch('/api/events/interested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId })
    })
    
    // If backend fails, the background polling (fetchEvents) will eventually fix the UI
    if (!res.ok) throw new Error()
  } catch (error) {
    console.error("Failed to sync interest")
    // Optional: Revert UI or wait for silent refresh
  }
}

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    const token = getAuthToken()
    
    // Optimistic delete
    const originalFeed = [...feed]
    const updatedFeed = feed.filter(item => item.data._id !== eventId)
    
    setFeed(updatedFeed)
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedFeed))

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        setFeed(originalFeed)
        localStorage.setItem(CACHE_KEY, JSON.stringify(originalFeed))
        alert('You cannot delete this event.')
      }
    } catch (error) {
      setFeed(originalFeed)
      localStorage.setItem(CACHE_KEY, JSON.stringify(originalFeed))
      alert('Failed to delete event.')
    }
  }

  const handleReport = async (eventId) => {
    if (!confirm('Report this event as spam/fake?')) return
    const token = getAuthToken()
    
    try {
      const res = await fetch('/api/events/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ eventId })
      })

      if (res.ok) alert('Report submitted. Thank you!')
    } catch (error) {
      alert('Failed to submit report.')
    }
  }

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible)
    if (!isSearchVisible) {
      setTimeout(() => document.getElementById('search-input')?.focus(), 100)
    }
  }

  const filteredFeed = feed.filter(item => {
    if (item.type === 'ad') return true
    const event = item.data
    const query = searchQuery.toLowerCase()
    return event.title.toLowerCase().includes(query) || 
           event.description.toLowerCase().includes(query) ||
           event.venue.toLowerCase().includes(query)
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage.url} 
          title={selectedImage.title}
          onClose={() => setSelectedImage(null)} 
        />
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px]">
          {!isSearchVisible ? (
            <>
              <div><h1 className="text-lg font-semibold">Campus Events</h1><p className="text-blue-100 text-xs">What is happening at NITC</p></div>
              <button onClick={toggleSearch} className="p-2 hover:bg-blue-700 rounded-full"><Search size={20} /></button>
            </>
          ) : (
             <div className="flex items-center gap-2 w-full">
               <button onClick={toggleSearch}><X size={20} /></button>
               <input 
                 id="search-input"
                 autoFocus 
                 className="w-full bg-blue-500/40 text-white p-2 rounded-lg placeholder-blue-200 outline-none" 
                 placeholder="Search events..." 
                 value={searchQuery} 
                 onChange={e=>setSearchQuery(e.target.value)} 
               />
             </div>
          )}
        </div>
      </div>

      <main className="pt-[72px] pb-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 mt-4 grid gap-4">
          
          {loading && feed.length === 0 ? (
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                   <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                   <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                   <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                   <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                 </div>
               ))}
             </div>
          ) : (
            filteredFeed.map((item, index) => {
              if (item.type === 'ad') {
                 return <AdCard key={`ad-${index}`} ad={item.data} />
              }

              const event = item.data
              const isOwner = currentUser?.userId === event.organizer.id
              const isAdmin = currentUser?.email === 'kandula_b220941ec@nitc.ac.in'
              const { fullDate, time } = formatDate(event.eventDate)

              return (
                <div key={event._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {event.image && (
                    <div 
                      className="relative w-full h-48 sm:h-56 bg-gray-200 overflow-hidden cursor-pointer group"
                      onClick={() => setSelectedImage({ url: event.image, title: event.title })}
                    >
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          parent.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'bg-blue-50');
                          parent.classList.remove('cursor-pointer', 'group');
                          parent.onclick = null;
                          parent.innerHTML = `
                            <div class="text-blue-400 flex flex-col items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1 opacity-40"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                              <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Preview Unavailable</span>
                            </div>
                          `;
                        }}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                          Tap to view
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
  <h2 className="text-lg font-bold text-gray-900 leading-tight">{event.title}</h2>
  <div className="flex gap-1">
    {/* ✅ ONLY SHOW IF OWNER OR ADMIN */}
    {(isOwner || isAdmin) && (
      <>
        <button 
          onClick={() => handleEdit(event)} 
          className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-full transition-colors"
        >
          <Edit3 size={18} />
        </button>
        <button 
          onClick={() => handleDelete(event._id)} 
          className="text-red-400 p-1.5 hover:bg-red-50 rounded-full transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </>
    )}
  </div>
</div>

                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalIcon size={16} className="text-blue-500" />
                        <span className="font-medium text-gray-900">{fullDate} <span className="text-gray-400">•</span> {time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="text-red-500" />
                        <span>{event.venue}</span>
                      </div>
                    </div>

                    <EventDescription text={event.description} />

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                      <button 
                        onClick={() => handleInterest(event._id, index)}
                        className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all active:scale-95 ${
                          event.interested?.includes(currentUser?.userId) 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                         <Heart size={16} className={event.interested?.includes(currentUser?.userId) ? "fill-current" : ""} /> 
                         {event.interested?.length || 0} Interested
                      </button>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                          By {event.organizer.name?.split(' ')[0] || 'User'}
                        </span>
                        <button onClick={() => handleReport(event._id)} className="text-gray-400 hover:text-red-500 p-1">
                          <Flag size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {!loading && filteredFeed.length === 0 && (
             <div className="text-center py-10 text-gray-500">
                <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
                <p>No events found.</p>
             </div>
          )}

        </div>
        
        {/* FAB */}
        <Link href="/events/create">
          <button 
            className="fixed right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 z-40 transition-all active:scale-95"
            style={{ bottom: 'calc(90px + env(safe-area-inset-bottom))' }}
          >
            <Plus size={24} className="sm:w-7 sm:h-7" />
          </button>
        </Link>
      </main>
    </div>
  )
}