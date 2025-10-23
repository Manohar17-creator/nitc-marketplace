'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, X, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function AttendancePage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [todayAttendance, setTodayAttendance] = useState({})
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    const cachedSubjects = localStorage.getItem('cached_subjects')
    const cachedStats = localStorage.getItem('cached_stats')
    
    if (cachedSubjects) {
        setSubjects(JSON.parse(cachedSubjects))
        setLoading(false)
    }
    if (cachedStats) {
        setStats(JSON.parse(cachedStats))
    }

    // Fetch fresh data in background
    fetchSubjects()
    fetchStats()
    fetchTodayAttendance()
    }, [router])

  useEffect(() => {
    if (selectedDate) {
      fetchTodayAttendance()
    }
  }, [selectedDate])

const fetchSubjects = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/attendance/subjects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()
    if (response.ok) {
      setSubjects(data.subjects)
      // Cache the data
      localStorage.setItem('cached_subjects', JSON.stringify(data.subjects))
    }
  } catch (error) {
    console.error('Failed to fetch subjects:', error)
  } finally {
    setLoading(false)
  }
}

const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/attendance/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()
    if (response.ok) {
      setStats(data)
      // Cache the data
      localStorage.setItem('cached_stats', JSON.stringify(data))
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/attendance/get?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        const attMap = {}
        data.attendance.forEach(att => {
          attMap[att.subjectId.toString()] = {
            status: att.status,
            reason: att.reason
          }
        })
        setTodayAttendance(attMap)
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    }
  }

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/attendance/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSubjectName })
      })
      if (response.ok) {
        setNewSubjectName('')
        setShowAddSubject(false)
        await fetchSubjects()
        await fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add subject')
      }
    } catch (error) {
      console.error('Failed to add subject:', error)
    }
  }

  const handleDeleteSubject = async (subjectId) => {
    if (!confirm('Delete this subject? All attendance data will be lost.')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/attendance/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        await fetchSubjects()
        await fetchStats()
      }
    } catch (error) {
      console.error('Failed to delete subject:', error)
    }
  }

  const handleAttendanceChange = (subjectId, field, value) => {
    setTodayAttendance(prev => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], [field]: value }
    }))
  }

  const handleSaveAttendance = async () => {
  try {
    const token = localStorage.getItem('token')
    
    const attendance = subjects.map(subject => ({
      subjectId: subject._id,
      status: todayAttendance[subject._id]?.status || 'noclass',
      reason: todayAttendance[subject._id]?.reason || null
    }))

    const response = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        date: selectedDate,
        attendance
      })
    })

    if (response.ok) {
      alert('Attendance saved! ✅')
      // Clear cache to force refresh
      localStorage.removeItem('cached_stats')
      await fetchStats()
    } else {
      alert('Failed to save attendance')
    }
  } catch (error) {
    console.error('Failed to save attendance:', error)
  }
}

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return '#10b981'
    if (percentage >= 60) return '#f59e0b'
    return '#ef4444'
  }

  // ✅ Navigate to subject details
  const handleBarClick = (subject) => {
    router.push(`/attendance/${subject.subjectId}`)
  }

  // Memoized chart data
  const chartData = useMemo(() => {
    return stats?.subjects.map(s => ({
      name: s.subjectName.length > 10 ? s.subjectName.substring(0, 10) + '..' : s.subjectName,
      fullName: s.subjectName,
      percentage: s.percentage,
      present: s.presentClasses,
      total: s.totalClasses,
      subjectId: s.subjectId
    })) || []
  }, [stats])

  if (loading) {
    return (
      <div className="bg-gray-50 overflow-x-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 overflow-x-hidden flex flex-col pb-nav-safe">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
  <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-[64px] sm:h-[72px]">
    
    {/* Left Section */}
    <div className="flex items-center gap-3">
      <Calendar size={24} />
      <div className="leading-tight">
        <h1 className="text-lg sm:text-xl font-semibold">Attendance</h1>
        <p className="text-blue-100 text-xs sm:text-sm">Track your classes</p>
      </div>
    </div>

    {/* Add Subject Button */}
    <button
      onClick={() => setShowAddSubject(true)}
      className="p-2 sm:p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-all active:scale-95"
    >
      <Plus size={20} className="text-white" />
    </button>
  </div>
</div>

<main className="pt-[72px] pb-nav-safe  bg-gray-50 min-h-screen">
      {/* Main Content */}
       <div className="max-w-6xl mx-auto px-4 mt-4 mb-4">
        {/* Date Selector */}
        <div className="bg-white rounded-lg p-4 shadow-md mb-4 overflow-hidden">
        <label className="block text-gray-900 font-semibold mb-2">Mark Attendance for</label>
        <div className="relative rounded-lg bg-white">
            <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
            style={{ WebkitAppearance: 'none' }}
            />
        </div>
        </div>


        {/* Subjects */}
        {subjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">No subjects added yet</p>
            <p className="text-gray-500 text-sm mb-4">Add your subjects to start tracking attendance</p>
            <button
              onClick={() => setShowAddSubject(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Subject</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map(subject => {
              const subjectStats = stats?.subjects.find(s => s.subjectId.toString() === subject._id.toString())
              const attendance = todayAttendance[subject._id] || {}

              return (
                <div key={subject._id} className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{subject.name}</h3>
                      {subjectStats && subjectStats.totalClasses > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-bold" style={{ color: getPercentageColor(subjectStats.percentage) }}>
                            {subjectStats.percentage}%
                          </span>
                          {' • '}
                          {subjectStats.presentClasses}/{subjectStats.totalClasses} classes
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(subject._id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={attendance.status || 'noclass'}
                        onChange={(e) => handleAttendanceChange(subject._id, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                      >
                        <option value="noclass">No Class</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>

                    {attendance.status === 'absent' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <select
                          value={attendance.reason || 'none'}
                          onChange={(e) => handleAttendanceChange(subject._id, 'reason', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                        >
                          <option value="none">None</option>
                          <option value="placement">Placement</option>
                          <option value="medical">Medical</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Attendance Chart */}
        {stats && stats.subjects.length > 0 && (
          <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 shadow-lg mt-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={24} className="text-purple-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Subject Attendance</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Tap any bar to view details</p>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={65}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} ticks={[0, 50, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-2.5 rounded-lg shadow-lg border border-gray-200">
                          <p className="font-semibold text-gray-900 text-xs">{data.fullName}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {data.percentage}% • {data.present}/{data.total}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="percentage"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => {
                    const subject = stats.subjects.find(s => s.subjectId === data.subjectId)
                    if (subject) handleBarClick(subject)
                  }}
                  cursor="pointer"
                  animationDuration={300}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPercentageColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Floating Save Button */}
        {subjects.length > 0 && (
          <button
            onClick={handleSaveAttendance}
            className="fixed bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-110 font-semibold flex items-center gap-2 px-6 py-4 z-40"
            style={{
              bottom: `calc(72px + env(safe-area-inset-bottom))`,
              right: '16px'
            }}
          >
            <Calendar size={20} />
            Save
          </button>
        )}
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-lg">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Subject</h2>
              <button
                onClick={() => {
                  setShowAddSubject(false)
                  setNewSubjectName('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <label className="block text-gray-900 font-semibold mb-2">Subject Name</label>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g., Data Structures, Networks"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                autoFocus
              />
              <button
                onClick={handleAddSubject}
                disabled={!newSubjectName.trim()}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
