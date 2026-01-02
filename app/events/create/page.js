'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { ArrowLeft, Calendar, MapPin, AlignLeft, Image as ImageIcon, Type, CheckCircle, Upload, X, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAuthToken } from '@/lib/auth-client'

function CreateEventContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef(null)
  const editId = searchParams.get('edit')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    eventDate: '',
    image: ''
  })
  
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // ✅ Helper 1: Convert UTC from server to Local Time for the input field
  const formatToLocalDatetime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.push('/login')
      return
    }

    if (editId) {
      const fetchEventData = async () => {
        setLoading(true)
        try {
          const res = await fetch(`/api/events/${editId}`)
          const data = await res.json()
          if (res.ok && data.event) {
            setFormData({
              title: data.event.title,
              description: data.event.description,
              venue: data.event.venue,
              // ✅ FIX: Use stable local formatter to prevent "flipping"
              eventDate: formatToLocalDatetime(data.event.eventDate),
              image: data.event.image || ''
            })
            if (data.event.image) setImagePreview(data.event.image)
          }
        } catch (err) {
          setError('Failed to load event details')
        } finally {
          setLoading(false)
        }
      }
      fetchEventData()
    }
  }, [editId, router]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Invalid image file'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image too large (max 5MB)'); return }

    setImageFile(file)
    setError('')
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return formData.image
    setUploadingImage(true)
    const uploadFormData = new FormData()
    uploadFormData.append('file', imageFile)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData })
      const data = await res.json()
      return data.url
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = getAuthToken()
      const imageUrl = await uploadImageToCloudinary()

      // ✅ FIX: Convert the local string back to a UTC ISO string for MongoDB
      const eventData = { 
        ...formData, 
        image: imageUrl,
        eventDate: new Date(formData.eventDate).toISOString() 
      }

      const method = editId ? 'PUT' : 'POST'
      const finalUrl = editId ? `/api/events/${editId}` : '/api/events'

      const res = await fetch(finalUrl, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(eventData)
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/events'), 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save event')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center animate-in zoom-in duration-300">
          <CheckCircle size={80} className="mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900">{editId ? 'Event Updated!' : 'Event Posted!'} 🎉</h2>
          <p className="text-gray-500 mt-2">Updating the campus feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-40 shadow-lg safe-top">
        <div className="max-w-2xl mx-auto h-16 flex items-center px-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="ml-2 text-lg font-bold">{editId ? 'Edit Event' : 'New Event'}</h1>
        </div>
      </div>

      <div className="h-16" />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">{error}</div>}

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><Type size={16} /> Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="What's happening?" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><Calendar size={16} /> Date & Time</label>
              <input type="datetime-local" name="eventDate" value={formData.eventDate} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><MapPin size={16} /> Venue</label>
              <input type="text" name="venue" value={formData.venue} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Location" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><AlignLeft size={16} /> Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Tell students more..." />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2"><ImageIcon size={16} /> Poster (Optional)</label>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
                <Upload className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload poster</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                   <button type="button" onClick={removeImage} className="bg-white text-red-600 p-2 rounded-full shadow-lg"><X size={20} /></button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            {loading || uploadingImage ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : (editId ? 'Update Event' : 'Post Event')}
          </button>
        </form>
      </main>
    </div>
  )
}

export default function CreateEvent() {
  return (
    <Suspense fallback={null}>
      <CreateEventContent />
    </Suspense>
  )
}