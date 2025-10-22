'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, X, ChevronLeft, TrendingUp, ArrowLeft, Filter } from 'lucide-react'
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
  
  // Subject detail view
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [subjectAttendance, setSubjectAttendance] = useState([])
  const [filterStatus, setFilterStatus] = useState('all') // all, present, absent
  const [sortOrder, setSortOrder] = useState('newest') // newest, oldest

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchSubjects()
    fetchStats()
    fetchTodayAttendance()
  }, [router])

  useEffect(() => {
    if (selectedDate && !selectedSubject) {
      fetchTodayAttendance()
    }
  }, [selectedDate, selectedSubject])

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
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/attendance/get?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const fetchSubjectDetail = async (subjectId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/attendance/subjects/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        setSubjectAttendance(data.attendance)
      }
    } catch (error) {
      console.error('Failed to fetch subject detail:', error)
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchSubjects()
        await fetchStats()
        if (selectedSubject?._id === subjectId) {
          setSelectedSubject(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete subject:', error)
    }
  }

  const handleAttendanceChange = (subjectId, field, value) => {
    setTodayAttendance(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
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

  const handleBarClick = (subject) => {
    setSelectedSubject(subject)
    setFilterStatus('all')
    setSortOrder('newest')
    fetchSubjectDetail(subject.subjectId)
  }

  // ✅ OPTIMIZED: Memoized chart data (no re-render on unrelated state changes)
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

  // ✅ FILTERED & SORTED attendance records (only present/absent, no noclass)
  const filteredAttendance = useMemo(() => {
    let filtered = subjectAttendance.filter(record => record.status !== 'noclass')
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus)
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
    
    return sorted
  }, [subjectAttendance, filterStatus, sortOrder])

  // Stats for detail view
  const detailStats = useMemo(() => {
    const records = subjectAttendance.filter(r => r.status !== 'noclass')
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    return { present, absent, total: present + absent }
  }, [subjectAttendance])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Subject Detail View
  if (selectedSubject) {
    return (
      <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col pb-nav-safe">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg flex-shrink-0 safe-top">
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => setSelectedSubject(null)}
              className="flex items-center gap-2 mb-3 hover:opacity-80 active:scale-95 transition"
            >
              <ArrowLeft size={22} />
              <span className="text-sm">Back to Overview</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{selectedSubject.subjectName}</h1>
                <p className="text-purple-100 text-xs sm:text-sm">
                  {selectedSubject.percentage}% • {detailStats.present}P / {detailStats.absent}A • Total: {detailStats.total}
                </p>
              </div>
              <button
                onClick={() => handleDeleteSubject(selectedSubject.subjectId)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b sticky top-[112px] sm:top-[120px] z-10 p-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 text-sm text-gray-700 flex-shrink-0">
              <Filter size={16} />
              <span className="font-medium">Filter:</span>
            </div>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({detailStats.total})
            </button>
            <button
              onClick={() => setFilterStatus('present')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                filterStatus === 'present'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Present ({detailStats.present})
            </button>
            <button
              onClick={() => setFilterStatus('absent')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                filterStatus === 'absent'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Absent ({detailStats.absent})
            </button>
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-700 font-medium">Sort:</span>
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                {sortOrder === 'newest' ? '↓ Newest' : '↑ Oldest'}
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="max-w-4xl mx-auto p-4 flex-1 w-full">
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">
                {filterStatus === 'all' 
                  ? 'No attendance records yet' 
                  : `No ${filterStatus} records`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAttendance.map(record => (
                <div
                  key={record._id}
                  className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                    record.status === 'present' 
                      ? 'border-green-500' 
                      : 'border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        {record.status === 'present' && (
                          <span className="text-green-600 font-medium">✓ Present</span>
                        )}
                        {record.status === 'absent' && (
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-medium">✗ Absent</span>
                            {record.reason && record.reason !== 'none' && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                {record.reason === 'placement' ? '💼 Placement' : '🏥 Medical'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`text-3xl ${
                      record.status === 'present' 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
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

  // Main Overview View
  return (
    <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col pb-nav-safe">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg flex-shrink-0 safe-top">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/"
            className="flex items-center gap-2 mb-3 hover:opacity-80 active:scale-95 transition"
          >
            <ChevronLeft size={22} />
            <span className="text-sm">Home</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={28} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Attendance</h1>
                <p className="text-purple-100 text-xs sm:text-sm">
                  Track your classes
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddSubject(true)}
              className="p-2 sm:p-3 bg-purple-500 hover:bg-purple-600 rounded-full transition-colors"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 flex-1 w-full">
        {/* Bar Chart - Optimized */}
        {stats && stats.subjects.length > 0 && (
          <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={24} className="text-purple-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Subject Attendance</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Tap any bar to view details</p>
            
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11 }}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="font-semibold text-gray-900 text-sm">{data.fullName}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {data.percentage}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {data.present}/{data.total} classes
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="percentage" 
                  radius={[6, 6, 0, 0]}
                  onClick={(data) => {
                    const subject = stats.subjects.find(s => s.subjectId === data.subjectId)
                    if (subject) handleBarClick(subject)
                  }}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPercentageColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-gray-600">≥75%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span className="text-gray-600">60-74%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-gray-600">&lt;60%</span>
              </div>
            </div>
          </div>
        )}

        {/* Date Selector */}
        <div className="bg-white rounded-lg p-4 shadow-md mb-4">
          <label className="block text-gray-900 font-semibold mb-2">
            Mark Attendance for
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Subjects List */}
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
                <div
                  key={subject._id}
                  className="bg-white rounded-lg p-4 shadow-md border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {subject.name}
                      </h3>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason
                        </label>
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

        {/* Save Button */}
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
              <label className="block text-gray-900 font-semibold mb-2">
                Subject Name
              </label>
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
    </div>
  )
}