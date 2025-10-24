'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar, X, Filter } from 'lucide-react'
import AttendanceFilters from './AttendanceFilters'

export default function SubjectAttendancePage() {
  const router = useRouter()
  const { id } = useParams()

  const [subject, setSubject] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterReason, setFilterReason] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [loading, setLoading] = useState(true)

  // ✅ Fetch subject attendance details
  useEffect(() => {
    const fetchSubjectDetail = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/attendance/subjects/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (res.ok) {
          if (Array.isArray(data.attendance)) {
            const name = data.attendance[0]?.subjectName || 'Unknown Subject'
            setSubject({ _id: id, name })
            setAttendance(data.attendance)
          } else if (data.subject && Array.isArray(data.attendance)) {
            setSubject(data.subject)
            setAttendance(data.attendance)
          }
        }
      } catch (err) {
        console.error('Error fetching subject details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubjectDetail()
  }, [id])

  // ✅ Filtered & sorted attendance
  const filteredAttendance = useMemo(() => {
    let filtered = attendance.filter(a => a.status !== 'noclass')

    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus)
    }

    if (filterReason !== 'all') {
      filtered = filtered.filter(a => {
        if (a.status !== 'absent') return false
        const reason = a.reason || 'none'
        return reason === filterReason
      })
    }

    const sorted = [...filtered].sort((a, b) => {
      const dA = new Date(a.date)
      const dB = new Date(b.date)
      return sortOrder === 'newest' ? dB - dA : dA - dB
    })

    return sorted
  }, [attendance, filterStatus, filterReason, sortOrder])

  const detailStats = useMemo(() => {
    const records = attendance.filter(r => r.status !== 'noclass')
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    return { present, absent, total: present + absent }
  }, [attendance])

  const reasonCounts = useMemo(() => {
    const absentRecords = attendance.filter(r => r.status === 'absent')
    return {
      placement: absentRecords.filter(r => r.reason === 'placement').length,
      medical: absentRecords.filter(r => r.reason === 'medical').length,
      none: absentRecords.filter(r => !r.reason || r.reason === 'none').length
    }
  }, [attendance])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Subject not found.
      </div>
    )
  }

  return (
    <div className="overflow-x-hidden bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
  <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px]">
    <div className="flex items-center justify-between px-4 h-[64px] sm:h-[72px]">
      {/* Left: Back + Subject Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/attendance')}
          className="flex items-center gap-1 hover:opacity-80 active:scale-95 transition"
        >
          <ArrowLeft size={22} />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{subject.name}</h1>
          <p className="text-blue-100 text-xs sm:text-sm">
            {detailStats.present}P / {detailStats.absent}A • Total: {detailStats.total}
          </p>
        </div>
      </div>

      {/* Optional future actions (e.g., edit) could go here */}
    </div>
  </div>
</div>

<AttendanceFilters
  filterStatus={filterStatus}
  setFilterStatus={setFilterStatus}
  filterReason={filterReason}
  setFilterReason={setFilterReason}
  reasonCounts={reasonCounts}
  stats={{
    all: attendance.length,
    present: detailStats.present,
    absent: detailStats.absent,
  }}
/>



<div className="h-4 sm:h-6"></div>

      {/* Attendance Records */}
      <div className="max-w-4xl mx-auto p-4 flex-1 w-full">
        {filteredAttendance.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAttendance.map(record => (
              <div
                key={record._id}
                className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                  record.status === 'present' ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {record.status === 'present' ? (
                    <div className="text-green-600 text-sm font-medium mt-1">
                      ✓ Present
                    </div>
                  ) : record.status === 'absent' ? (
                    <div className="mt-1">
                      <div className="text-red-600 text-sm font-medium flex items-center gap-2">
                        ✗ Absent
                        {record.reason && record.reason !== 'none' && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                            {record.reason === 'placement' ? '💼 Placement' : '🏥 Medical'}
                          </span>
                        )}
                      </div>
                      {record.description && (
                        <p className="text-gray-600 text-xs mt-1 italic">
                           {record.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm mt-1">No Class</div>
                  )}

                  </div>
                  
                  
                  <div className={`text-3xl ${record.status === 'present' ? 'text-green-500' : 'text-red-500'}`}>
                    {record.status === 'present' ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
