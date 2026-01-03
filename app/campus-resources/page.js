'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Phone, ZoomIn, X, Loader2, Download } from 'lucide-react'

export default function CampusResourcesPage() {
  const router = useRouter()
  const [calendar, setCalendar] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState(null)

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/campus-resources')
      const data = await res.json()
      if (res.ok) {
        setCalendar(data.calendar)
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Failed to load resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleZoom = (imageUrl, title) => {
    setZoomedImage({ url: imageUrl, title })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-20 shadow-lg safe-top">
        <div className="max-w-4xl mx-auto h-[64px] flex items-center px-4 gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Campus Resources</h1>
        </div>
      </div>

      <div className="pt-[80px] px-4 pb-8 max-w-4xl mx-auto space-y-6">
        
        {/* Academic Calendar Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-50 px-5 py-4 border-b flex items-center gap-3">
            <Calendar className="text-blue-600" size={24} />
            <h2 className="font-bold text-gray-900 text-lg">Academic Calendar</h2>
          </div>
          
          <div className="p-5">
            {calendar ? (
              <div className="relative group">
                <img 
                  src={calendar.imageUrl} 
                  alt="Academic Calendar"
                  className="w-full rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleZoom(calendar.imageUrl, 'Academic Calendar')}
                />
                <button
                  onClick={() => handleZoom(calendar.imageUrl, 'Academic Calendar')}
                  className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/80"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Calendar not available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Important Contacts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-green-50 px-5 py-4 border-b flex items-center gap-3">
            <Phone className="text-green-600" size={24} />
            <h2 className="font-bold text-gray-900 text-lg">Important Contacts</h2>
          </div>
          
          <div className="p-5">
            {contacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((contact, index) => (
                  <div key={contact._id || index} className="relative group">
                    <img 
                      src={contact.imageUrl} 
                      alt={contact.title || `Contact Sheet ${index + 1}`}
                      className="w-full rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleZoom(contact.imageUrl, contact.title || `Contact Sheet ${index + 1}`)}
                    />
                    {contact.title && (
                      <p className="mt-2 text-sm font-semibold text-gray-700 text-center">
                        {contact.title}
                      </p>
                    )}
                    <button
                      onClick={() => handleZoom(contact.imageUrl, contact.title || `Contact Sheet ${index + 1}`)}
                      className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/80"
                    >
                      <ZoomIn size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Phone size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No contact information available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] overflow-auto">
            <button
              onClick={() => setZoomedImage(null)}
              className="fixed top-4 right-4 bg-white text-gray-900 p-3 rounded-full shadow-lg hover:bg-gray-100 z-10"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col items-center">
              <h3 className="text-white text-lg font-bold mb-4">{zoomedImage.title}</h3>
              <img 
                src={zoomedImage.url} 
                alt={zoomedImage.title}
                className="w-full h-auto rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <a
                href={zoomedImage.url}
                download
                className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={20} /> Download Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}