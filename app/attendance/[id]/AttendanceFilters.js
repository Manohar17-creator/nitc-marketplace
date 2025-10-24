import { useEffect, useState } from 'react'

export default function AttendanceFilters({ filters, onFilterChange }) {
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // user scrolled down — hide header
        setShowHeader(false)
      } else {
        // user scrolled up — show header
        setShowHeader(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <div
      className={`fixed top-[64px] left-0 right-0 z-30 bg-white border-b border-gray-100 shadow-sm transition-transform duration-300 ease-in-out ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="space-y-3 overflow-x-hidden px-2">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-2 items-center justify-between">
        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
            All (4)
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            Present (3)
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            Absent (1)
          </button>
        </div>

        {/* Reason Filters - Scrollable Row */}
<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 snap-x snap-mandatory">
  <span className="flex-shrink-0 font-medium text-gray-700">Reason:</span>
  
  <div className="flex items-center gap-2 flex-nowrap">
    <button
      onClick={() => setFilterReason('all')}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        filterReason === 'all'
          ? 'bg-purple-600 text-white shadow-md scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      All
    </button>

    <button
      onClick={() => setFilterReason('placement')}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        filterReason === 'placement'
          ? 'bg-gray-200 text-gray-900 border border-gray-300'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      💼 Placement ({reasonCounts.placement})
    </button>

    <button
      onClick={() => setFilterReason('medical')}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        filterReason === 'medical'
          ? 'bg-gray-200 text-gray-900 border border-gray-300'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      🏥 Medical ({reasonCounts.medical})
    </button>
  </div>
</div>

      </div>
      </div>
    </div>
  )
}
