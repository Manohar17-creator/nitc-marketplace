'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Calendar as CalIcon, Plus, Flag, Trash2, Heart, Search, Calendar, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AdCard from '@/components/AdCard' // 👈 Using the nice Ad Card

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

export default function EventsPage() {
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchEvents()
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUser(payload)
      } catch (e) {}
    }
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      if (data.feed) setFeed(data.feed)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleInterest = async (eventId, index) => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/auth/login')

    // Optimistic Update
    const newFeed = [...feed]
    const item = newFeed[index]
    if (item.type !== 'event') return

    const event = item.data
    const isInterested = event.interested.includes(currentUser?.userId)
    
    if (isInterested) {
      event.interested = event.interested.filter(id => id !== currentUser.userId)
    } else {
      event.interested.push(currentUser.userId)
    }
    setFeed(newFeed)

    await fetch('/api/events/interested', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId })
    })
  }

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    const token = localStorage.getItem('token')
    
    const res = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (res.ok) {
      setFeed(feed.filter(item => item.data._id !== eventId))
    } else {
      alert('You cannot delete this event.')
    }
  }

  const handleReport = async (eventId) => {
    if (!confirm('Report this event as spam/fake?')) return
    const token = localStorage.getItem('token')
    
    const res = await fetch('/api/events/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ eventId })
    })

    if (res.ok) alert('Report submitted. Thank you!')
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
    return event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           event.description.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Format Date Helper
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
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px]">
          {!isSearchVisible ? (
            <>
              <div><h1 className="text-lg font-semibold">Campus Events</h1><p className="text-blue-100 text-xs">What's happening at NITC</p></div>
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
          
          {loading ? (
             <div className="text-center py-10 text-gray-500">Loading events...</div>
          ) : (
            filteredFeed.map((item, index) => {
              
              // 👇 USE AdCard COMPONENT HERE (Fixes Ugly Ad Issue)
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
                    <div className="relative h-48 w-full">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">{event.title}</h2>
                      {(isOwner || isAdmin) && (
                        <button onClick={() => handleDelete(event._id)} className="text-red-400 p-1 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                      )}
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
            style={{ bottom: '90px' }}
          >
            <Plus size={24} className="sm:w-7 sm:h-7" />
          </button>
        </Link>
      </main>
    </div>
  )
}