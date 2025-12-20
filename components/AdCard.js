'use client'
import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Eye } from 'lucide-react'

export default function AdCard({ ad }) {
  const [hasViewed, setHasViewed] = useState(false)
  const cardRef = useRef(null)

  // 👇 Track View (Impression)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasViewed) {
        setHasViewed(true)
        // Fire tracking API
        fetch('/api/ads/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adId: ad._id })
        })
      }
    }, { threshold: 0.5 }) // Trigger when 50% of ad is visible

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [hasViewed, ad._id])

  // 👇 Track Click
  const handleAdClick = async () => {
    try { fetch('/api/ads/track', { method: 'POST', body: JSON.stringify({ adId: ad._id }) }) } catch (e) {}
  }

  return (
    <div ref={cardRef} className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden mb-4 relative group">
      <div className="absolute top-2 left-2 z-10">
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm ${
          ad.type === 'local' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
        }`}>
          {ad.type === 'local' ? '📍 Local Partner' : '📢 Sponsored'}
        </span>
      </div>

      <a href={ad.link || '#'} target="_blank" rel="noopener noreferrer" className="block" onClick={handleAdClick}>
        <div className="relative h-48 w-full bg-gray-50">
          <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-3 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{ad.title}</h3>
            <p className="text-xs text-gray-600 font-medium">
              {ad.description || 'Check this out'}
            </p>
          </div>
          <ExternalLink size={16} className="text-blue-400" />
        </div>
      </a>
    </div>
  )
}