'use client'
import { useState, useEffect } from 'react'

export default function AttendanceFilters({
  filterStatus,
  setFilterStatus,
  filterReason,
  setFilterReason,
  reasonCounts = { placement: 0, medical: 0 },
  stats = { all: 0, present: 0, absent: 0 },
}) {
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // ✅ Hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setShowHeader(!(currentScrollY > lastScrollY && currentScrollY > 100))
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
      <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
        {/* ✅ Status Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {[
            { id: 'all', label: `All (${stats.all})` },
            { id: 'present', label: `Present (${stats.present})` },
            { id: 'absent', label: `Absent (${stats.absent})` },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilterStatus(option.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 transition-all ${
                filterStatus === option.id
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* ✅ Reason Filters - Scrollable Row (Single Line) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory">
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
              💼 Placement ({reasonCounts.placement || 0})
            </button>

            <button
              onClick={() => setFilterReason('medical')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterReason === 'medical'
                  ? 'bg-gray-200 text-gray-900 border border-gray-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏥 Medical ({reasonCounts.medical || 0})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
