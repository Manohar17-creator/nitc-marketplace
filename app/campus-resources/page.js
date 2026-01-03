'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Phone, ZoomIn, X, Loader2, Download, FileText, Trash2, Plus } from 'lucide-react'
import { getAuthToken, getUserData } from '@/lib/auth-client'

export default function CampusResourcesPage() {
  const router = useRouter()
  const [calendar, setCalendar] = useState(null)
  const [contacts, setContacts] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Admin controls
  const [uploadingCalendar, setUploadingCalendar] = useState(false)
  const [uploadingContact, setUploadingContact] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [newContactTitle, setNewContactTitle] = useState('')
  const [newDocumentTitle, setNewDocumentTitle] = useState('')
  const [newDocumentImages, setNewDocumentImages] = useState([])

  useEffect(() => {
    fetchResources()
    checkAdmin()
  }, [])

  const checkAdmin = () => {
    const user = getUserData()
    if (user && user.email === 'kandula_b220941ec@nitc.ac.in') {
      setIsAdmin(true)
    }
  }

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/campus-resources')
      const data = await res.json()
      if (res.ok) {
        setCalendar(data.calendar)
        setContacts(data.contacts || [])
        setDocuments(data.documents || [])
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

  // Calendar upload
  const handleCalendarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingCalendar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) throw new Error('Upload failed')

      const token = getAuthToken()
      const saveRes = await fetch('/api/campus-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'calendar',
          imageUrl: uploadData.url
        })
      })

      if (saveRes.ok) {
        await fetchResources()
        alert('Calendar updated successfully!')
      }
    } catch (error) {
      console.error('Calendar upload error:', error)
      alert('Failed to upload calendar')
    } finally {
      setUploadingCalendar(false)
    }
  }

  // Contact upload
  const handleContactUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!newContactTitle.trim()) {
      alert('Please enter a title')
      return
    }

    setUploadingContact(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) throw new Error('Upload failed')

      const token = getAuthToken()
      const saveRes = await fetch('/api/campus-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'contact',
          imageUrl: uploadData.url,
          title: newContactTitle
        })
      })

      if (saveRes.ok) {
        await fetchResources()
        setNewContactTitle('')
        alert('Contact sheet added!')
      }
    } catch (error) {
      console.error('Contact upload error:', error)
      alert('Failed to upload contact')
    } finally {
      setUploadingContact(false)
    }
  }

  // Document upload (multiple images)
  const handleDocumentImagesSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingDocument(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error('Upload failed')
        return data.url
      })

      const urls = await Promise.all(uploadPromises)
      setNewDocumentImages(prev => [...prev, ...urls])
    } catch (error) {
      console.error('Document images upload error:', error)
      alert('Failed to upload images')
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDocumentSubmit = async () => {
    if (!newDocumentTitle.trim()) {
      alert('Please enter a document title')
      return
    }
    if (newDocumentImages.length === 0) {
      alert('Please add at least one image')
      return
    }

    try {
      const token = getAuthToken()
      const saveRes = await fetch('/api/campus-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'document',
          title: newDocumentTitle,
          imageUrls: newDocumentImages
        })
      })

      if (saveRes.ok) {
        await fetchResources()
        setNewDocumentTitle('')
        setNewDocumentImages([])
        alert('Document added successfully!')
      }
    } catch (error) {
      console.error('Document submit error:', error)
      alert('Failed to save document')
    }
  }

  const handleDeleteContact = async (id) => {
    if (!confirm('Delete this contact sheet?')) return

    try {
      const token = getAuthToken()
      const res = await fetch(`/api/campus-resources?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        await fetchResources()
        alert('Contact deleted')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete')
    }
  }

  const handleDeleteDocument = async (id) => {
    if (!confirm('Delete this document?')) return

    try {
      const token = getAuthToken()
      const res = await fetch(`/api/campus-resources?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        await fetchResources()
        alert('Document deleted')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete')
    }
  }

  const removeDocumentImage = (index) => {
    setNewDocumentImages(prev => prev.filter((_, i) => i !== index))
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-purple-50 px-5 py-4 border-b flex items-center gap-3">
            <FileText className="text-purple-600" size={24} />
            <h2 className="font-bold text-gray-900 text-lg">Useful Documents ({documents.length})</h2>
          </div>
          
          <div className="p-5">
            {isAdmin && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Add New Document</h4>
                <div className="space-y-3">
                  <input 
                    type="text"
                    placeholder="Document Title (e.g., Bus Schedule, Campus Map)"
                    value={newDocumentTitle}
                    onChange={e => setNewDocumentTitle(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                  
                  {/* Image Preview */}
                  {newDocumentImages.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <p className="text-sm text-gray-600 font-medium">Selected Images ({newDocumentImages.length}):</p>
                      {newDocumentImages.map((url, idx) => (
                        <div key={idx} className="relative border rounded-lg p-2 flex items-center gap-3 bg-white">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                          <span className="text-sm text-gray-700 flex-1">Image {idx + 1}</span>
                          <button
                            onClick={() => removeDocumentImage(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleDocumentImagesSelect}
                      className="hidden"
                      id="document-upload"
                      disabled={uploadingDocument}
                    />
                    <label 
                      htmlFor="document-upload"
                      className={`cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 ${uploadingDocument ? 'opacity-50' : ''}`}
                    >
                      <Plus size={18} />
                      {uploadingDocument ? 'Uploading...' : 'Add Images'}
                    </label>
                    
                    {newDocumentImages.length > 0 && (
                      <button
                        onClick={handleDocumentSubmit}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Save Document
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {documents.length > 0 ? (
              <div className="space-y-6">
                {documents.map((doc) => (
                  <div key={doc._id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <FileText size={20} className="text-purple-600" />
                        {doc.title}
                      </h3>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    
                    {/* Vertical Image List */}
                    <div className="space-y-3">
                      {doc.imageUrls?.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={url} 
                            alt={`${doc.title} - Page ${idx + 1}`}
                            className="w-full rounded-lg border border-gray-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleZoom(url, `${doc.title} - Page ${idx + 1}`)}
                          />
                          <button
                            onClick={() => handleZoom(url, `${doc.title} - Page ${idx + 1}`)}
                            className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/80"
                          >
                            <ZoomIn size={20} />
                          </button>
                          <span className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Page {idx + 1} of {doc.imageUrls.length}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Added on {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Academic Calendar Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-50 px-5 py-4 border-b flex items-center gap-3">
            <Calendar className="text-blue-600" size={24} />
            <h2 className="font-bold text-gray-900 text-lg">Academic Calendar</h2>
          </div>
          
          <div className="p-5">
            {calendar ? (
              <div className="relative group mb-4">
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
                <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(calendar.updatedAt).toLocaleString()}</p>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 mb-4">
                <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Calendar not available yet</p>
              </div>
            )}

            {isAdmin && (
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCalendarUpload}
                  className="hidden"
                  id="calendar-upload"
                  disabled={uploadingCalendar}
                />
                <label 
                  htmlFor="calendar-upload"
                  className={`cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block ${uploadingCalendar ? 'opacity-50' : ''}`}
                >
                  {uploadingCalendar ? 'Uploading...' : calendar ? 'Update Calendar' : 'Upload Calendar'}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Important Contacts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-green-50 px-5 py-4 border-b flex items-center gap-3">
            <Phone className="text-green-600" size={24} />
            <h2 className="font-bold text-gray-900 text-lg">Important Contacts ({contacts.length})</h2>
          </div>
          
          <div className="p-5">
            {isAdmin && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Add New Contact Sheet</h4>
                <div className="space-y-3">
                  <input 
                    type="text"
                    placeholder="Title (e.g., Auto Drivers, Emergency Numbers)"
                    value={newContactTitle}
                    onChange={e => setNewContactTitle(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                  <div className="flex gap-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleContactUpload}
                      className="hidden"
                      id="contact-upload"
                      disabled={uploadingContact}
                    />
                    <label 
                      htmlFor="contact-upload"
                      className={`cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors ${uploadingContact ? 'opacity-50' : ''}`}
                    >
                      {uploadingContact ? 'Uploading...' : 'Upload Contact Sheet'}
                    </label>
                  </div>
                </div>
              </div>
            )}

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
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteContact(contact._id)}
                        className="absolute top-3 left-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
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

        {/* Useful Documents Section (NEW) */}
        
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