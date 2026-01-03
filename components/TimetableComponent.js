import { useState, useEffect } from 'react'
import { Calendar, Edit3, Save, RotateCcw, Palette, X, Link2, Check } from 'lucide-react'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const PERIODS = [
  { label: '8-9', id: '0' },
  { label: '9-10', id: '1' },
  { label: '10-11', id: '2' },
  { label: '11-12', id: '3' },
  { label: '12-1', id: '4' },
  { label: '1-2', id: '5' },
  { label: '2-3', id: '6' },
  { label: '3-4', id: '7' },
  { label: '4-5', id: '8' },
  { label: '5-6', id: '9' },
]

const PRESET_COLORS = {
  white: { bg: '#ffffff', name: 'White' },
  blue: { bg: '#3b82f6', name: 'Blue' },
  purple: { bg: '#a855f7', name: 'Purple' },
  pink: { bg: '#ec4899', name: 'Pink' },
  red: { bg: '#ef4444', name: 'Red' },
  orange: { bg: '#f97316', name: 'Orange' },
  yellow: { bg: '#eab308', name: 'Yellow' },
  green: { bg: '#10b981', name: 'Green' },
  teal: { bg: '#14b8a6', name: 'Teal' },
  cyan: { bg: '#06b6d4', name: 'Cyan' },
}

export default function TimetableComponent() {
  const [isEditMode, setIsEditMode] = useState(false)
  const [timetable, setTimetable] = useState({})
  const [mergedCells, setMergedCells] = useState({})
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [tempValue, setTempValue] = useState('')
  const [mergingMode, setMergingMode] = useState(false)
  const [mergeSelection, setMergeSelection] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('attendance_timetable')
    const savedMerged = localStorage.getItem('attendance_timetable_merged')
    
    if (saved) {
      try {
        setTimetable(JSON.parse(saved))
      } catch (e) {
        initializeDefaultTimetable()
      }
    } else {
      initializeDefaultTimetable()
    }

    if (savedMerged) {
      try {
        setMergedCells(JSON.parse(savedMerged))
      } catch (e) {}
    }
  }, [])

  const initializeDefaultTimetable = () => {
    const initial = {}
    DAYS.forEach(day => {
      PERIODS.forEach(period => {
        initial[`${day}-${period.id}`] = { text: '', color: 'white' }
      })
    })
    setTimetable(initial)
  }

  useEffect(() => {
    if (Object.keys(timetable).length > 0) {
      localStorage.setItem('attendance_timetable', JSON.stringify(timetable))
    }
  }, [timetable])

  useEffect(() => {
    localStorage.setItem('attendance_timetable_merged', JSON.stringify(mergedCells))
  }, [mergedCells])

  const getCellData = (day, periodId) => {
    const key = `${day}-${periodId}`
    return timetable[key] || { text: '', color: 'white' }
  }

  const isCellMerged = (day, periodId) => {
    const key = `${day}-${periodId}`
    for (const [mergeKey, mergeData] of Object.entries(mergedCells)) {
      if (mergeData.cells.includes(key) && mergeKey !== key) {
        return true
      }
    }
    return false
  }

  const getMergeInfo = (day, periodId) => {
    const key = `${day}-${periodId}`
    return mergedCells[key] || null
  }

  const handleCellClick = (day, periodId) => {
    const key = `${day}-${periodId}`
    
    if (mergingMode) {
      if (mergeSelection.includes(key)) {
        setMergeSelection(mergeSelection.filter(k => k !== key))
      } else {
        setMergeSelection([...mergeSelection, key])
      }
      return
    }

    if (!isEditMode || isCellMerged(day, periodId)) return
    
    const cellData = getCellData(day, periodId)
    setEditingCell(key)
    setTempValue(cellData.text)
  }

  const handleCellLongPress = (day, periodId) => {
    if (!isEditMode || isCellMerged(day, periodId) || mergingMode) return
    
    const key = `${day}-${periodId}`
    setSelectedCell(key)
    setShowColorPicker(true)
  }

  const saveEdit = () => {
    if (editingCell) {
      setTimetable(prev => ({
        ...prev,
        [editingCell]: {
          ...prev[editingCell],
          text: tempValue.trim()
        }
      }))
      setEditingCell(null)
      setTempValue('')
    }
  }

  const applyColor = (colorKey) => {
    if (selectedCell) {
      setTimetable(prev => ({
        ...prev,
        [selectedCell]: {
          ...prev[selectedCell],
          color: colorKey
        }
      }))
    }
    setShowColorPicker(false)
    setSelectedCell(null)
  }

  const startMerging = () => {
    setMergingMode(true)
    setMergeSelection([])
  }

  const cancelMerging = () => {
    setMergingMode(false)
    setMergeSelection([])
  }

  const executeMerge = () => {
    if (mergeSelection.length < 2) {
      alert('Select at least 2 cells to merge')
      return
    }

    // Parse selections
    const cells = mergeSelection.map(key => {
      const [day, periodId] = key.split('-')
      return { day, periodId: parseInt(periodId), key }
    })

    // Check same row
    const uniqueDays = [...new Set(cells.map(c => c.day))]
    if (uniqueDays.length > 1) {
      alert('Can only merge cells in the same row (same day)')
      return
    }

    // Check consecutive
    const periods = cells.map(c => c.periodId).sort((a, b) => a - b)
    for (let i = 1; i < periods.length; i++) {
      if (periods[i] !== periods[i-1] + 1) {
        alert('Can only merge consecutive cells')
        return
      }
    }

    // Check if any cell is already merged
    for (const cell of cells) {
      if (isCellMerged(cell.day, cell.periodId.toString())) {
        alert('Cannot merge cells that are already merged')
        return
      }
    }

    const firstCell = cells.sort((a, b) => a.periodId - b.periodId)[0]
    const cellKeys = cells.map(c => c.key)

    setMergedCells(prev => ({
      ...prev,
      [firstCell.key]: {
        cells: cellKeys,
        colspan: cellKeys.length
      }
    }))

    setMergingMode(false)
    setMergeSelection([])
  }

  const unmergeCell = (day, periodId) => {
    const key = `${day}-${periodId}`
    if (mergedCells[key]) {
      const newMerged = { ...mergedCells }
      delete newMerged[key]
      setMergedCells(newMerged)
    }
  }

  const resetTimetable = () => {
    if (confirm('Reset timetable to default? All data will be lost.')) {
      const initial = {}
      DAYS.forEach(day => {
        PERIODS.forEach(period => {
          initial[`${day}-${period.id}`] = { text: '', color: 'white' }
        })
      })
      setTimetable(initial)
      setMergedCells({})
      localStorage.setItem('attendance_timetable', JSON.stringify(initial))
      localStorage.setItem('attendance_timetable_merged', JSON.stringify({}))
      setIsEditMode(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" size={20} />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Timetable</h2>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!mergingMode && (
            <>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isEditMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isEditMode ? <Save size={14} /> : <Edit3 size={14} />}
                <span>{isEditMode ? 'Save' : 'Edit'}</span>
              </button>
              
              {isEditMode && (
                <>
                  <button
                    onClick={startMerging}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
                  >
                    <Link2 size={14} />
                    <span>Merge Classes</span>
                  </button>
                  
                  <button
                    onClick={resetTimetable}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                  >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Reset to Default</span>
                    <span className="sm:hidden">Reset</span>
                  </button>
                </>
              )}
            </>
          )}
          
          {mergingMode && (
            <>
              <button
                onClick={executeMerge}
                disabled={mergeSelection.length < 2}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                  mergeSelection.length >= 2
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Check size={14} />
                <span>Merge ({mergeSelection.length})</span>
              </button>
              
              <button
                onClick={cancelMerging}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isEditMode && !mergingMode && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-800 border border-blue-200">
            <strong>Edit Mode:</strong> Click to edit text • Double-click to change color
        </div>
        )}

      {mergingMode && (
        <div className="mb-3 p-2 bg-purple-50 rounded-lg text-xs text-purple-800 border border-purple-200">
          <strong>Merge Mode:</strong> Click cells in the same row (one by one) → Click Merge button. Double-click any cell to unmerge.
        </div>
      )}

      <div 
        className="w-full -mx-3 px-3"
        style={{ 
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          willChange: 'scroll-position'
        }}
      >
        <table className="border-collapse" style={{ minWidth: '900px', width: 'max-content' }}>
          <thead>
            <tr>
              <th className="bg-gray-100 border-2 border-gray-300 p-1.5 text-[10px] sm:text-xs font-bold text-gray-700" style={{ minWidth: '60px' }}>
                DAY
              </th>
              {PERIODS.map(period => (
                <th
                  key={period.id}
                  className="bg-gray-100 border-2 border-gray-300 p-1.5 text-[10px] sm:text-xs font-bold text-gray-700"
                  style={{ minWidth: '85px' }}
                >
                  {period.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="bg-gray-100 border-2 border-gray-300 p-1.5 text-[10px] sm:text-xs font-bold text-gray-700 text-center" style={{ minWidth: '60px' }}>
                  {day}
                </td>
                {PERIODS.map(period => {
                  if (isCellMerged(day, period.id)) return null

                  const cellData = getCellData(day, period.id)
                  const cellKey = `${day}-${period.id}`
                  const isEditing = editingCell === cellKey
                  const colorData = PRESET_COLORS[cellData.color] || PRESET_COLORS.white
                  const mergeInfo = mergedCells[cellKey]
                  const isSelected = mergeSelection.includes(cellKey)

                  return (
    <td
      key={period.id}
      colSpan={mergeInfo ? mergeInfo.colspan : 1}
      // SINGLE CLICK: Handles text editing or merge selection
      onClick={() => handleCellClick(day, period.id)}
      
      // DOUBLE CLICK: Handles color picker or unmerging
      onDoubleClick={(e) => {
        if (!isEditMode) return;
        if (mergeInfo) {
          unmergeCell(day, period.id);
        } else {
          // Open Color Picker on Double Click
          setSelectedCell(cellKey);
          setShowColorPicker(true);
        }
      }}
      
      className={`relative border-2 border-gray-300 p-1.5 text-center font-semibold text-[10px] sm:text-xs transition-all ${
        isEditMode && !isEditing ? 'cursor-pointer hover:brightness-95' : ''
      } ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''}`}
      style={{ 
        backgroundColor: isSelected ? '#dbeafe' : colorData.bg, 
        color: '#000',
        minHeight: '55px',
        height: '55px',
        minWidth: '85px'
      }}
    >
      {isEditMode && !mergeInfo && !isEditing && (
        <div className="absolute top-0.5 right-0.5 opacity-30">
          <Palette size={8} />
        </div>
      )}

      {isEditing ? (
        <div className="flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') {
                setEditingCell(null)
                setTempValue('')
              }
            }}
            onBlur={saveEdit}
            className="w-full px-1 py-0.5 text-[10px] sm:text-xs border-2 border-blue-500 rounded text-black bg-white font-semibold"
            maxLength={15}
            autoFocus
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full break-words leading-tight">
          {cellData.text || (isEditMode && !mergingMode ? <span className="text-gray-400 font-normal">Empty</span> : '')}
        </div>
      )}
    </td>
  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showColorPicker && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowColorPicker(false)
            setSelectedCell(null)
          }}
        >
          <div 
            className="bg-white rounded-lg p-4 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Choose Color</h3>
              </div>
              <button
                onClick={() => {
                  setShowColorPicker(false)
                  setSelectedCell(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PRESET_COLORS).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => applyColor(key)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all active:scale-95"
                >
                  <div 
                    className="w-full h-10 rounded border border-gray-300" 
                    style={{ backgroundColor: data.bg }}
                  ></div>
                  <span className="text-[10px] font-medium text-gray-900">{data.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}