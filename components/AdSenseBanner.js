'use client'
import { useEffect, useRef } from 'react'

export default function AdSenseBanner({ dataAdSlot }) {
  const adRequested = useRef(false) // Track if we already requested this ad

  useEffect(() => {
    // 1. Guard: If ad already requested or window undefined, stop.
    if (adRequested.current || typeof window === 'undefined') return

    try {
      // 2. Push the ad
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      adRequested.current = true // Mark as requested
    } catch (err) {
      console.error('AdSense Error:', err)
    }
  }, [])

  return (
    // 3. Fix "availableWidth=0": Ensure width-full and block display
    <div className="w-full my-4 overflow-hidden rounded-lg border border-gray-100 shadow-sm bg-gray-50 text-center min-h-[250px] flex items-center justify-center relative">
      <span className="text-[10px] text-gray-400 absolute bottom-1 right-2 z-0">Advertisement</span>
      
      {/* 4. The Ad Slot */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }} // Force block display
        data-ad-client="ca-pub-2297395818809684" // Your Publisher ID
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}