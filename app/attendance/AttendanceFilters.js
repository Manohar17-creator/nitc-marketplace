'use client'

export default function AttendanceFilters({
  filterStatus,
  setFilterStatus,
  filterReason,
  setFilterReason,
  reasonCounts = { placement: 0, medical: 0 },
  stats = { all: 0, present: 0, absent: 0 },
}) {
  return (
    <div
  className="fixed left-0 right-0 z-10 bg-white border-b border-gray-100 shadow-sm
             top-[64px] sm:top-[72px]"
>
      <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: `All (${stats.all})`, color: 'blue' },
            { id: 'present', label: `Present (${stats.present})`, color: 'green' },
            { id: 'absent', label: `Absent (${stats.absent})`, color: 'red' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilterStatus(option.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === option.id
                  ? `bg-${option.color}-600 text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Reason Filters */}
        {(filterStatus === 'absent' || filterStatus === 'all') && stats.absent > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="flex-shrink-0 font-medium text-gray-700 text-sm">Reason:</span>
            <button
              onClick={() => setFilterReason('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterReason === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterReason('placement')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterReason === 'placement'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💼 Placement ({reasonCounts.placement || 0})
            </button>
            <button
              onClick={() => setFilterReason('medical')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterReason === 'medical'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏥 Medical ({reasonCounts.medical || 0})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}