'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, X, ChevronLeft, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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
    if (percentage >= 75) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-screen-mobile bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg flex-shrink-0">
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

      <div className="max-w-4xl mx-auto p-4 flex-1 w-full pb-24">
        {/* Overall Stats */}
        {stats && stats.overall.totalClasses > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={24} />
              <h2 className="text-xl font-bold">Overall Attendance</h2>
            </div>
            <div className="text-5xl font-bold mb-2">
              {stats.overall.percentage}%
            </div>
            <div className="text-purple-100 text-sm">
              {stats.overall.presentClasses} present out of {stats.overall.totalClasses} classes
            </div>
            {stats.overall.percentage < 75 && (
              <div className="mt-3 px-3 py-2 bg-red-500/20 rounded-lg text-sm">
                ⚠️ Below 75%! Attend more classes.
              </div>
            )}
          </div>
        )}

        {/* Date Selector */}
        <div className="bg-white rounded-lg p-4 shadow-md mb-4">
          <label className="block text-gray-900 font-semibold mb-2">
            Select Date
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
                          <span className={`font-bold ${getPercentageColor(subjectStats.percentage)}`}>
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

                  {/* Attendance Dropdown */}
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

                    {/* Reason (only if absent) */}
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
            className="fixed bottom-6 right-6 px-6 py-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-110 font-semibold flex items-center gap-2"
          >
            <Calendar size={20} />
            Save Attendance
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