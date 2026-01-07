'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Phone, ZoomIn, X, Loader2, FileText, Trash2, Plus, GripVertical, Download, File } from 'lucide-react'
import { getAuthToken, getUserData } from '@/lib/auth-client'
import ImageZoomModal from '@/components/ImageZoomModal'

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
  const [newDocumentFiles, setNewDocumentFiles] = useState([])
  
  // Drag state for reordering
  const [draggedFileIndex, setDraggedFileIndex] = useState(null)
  const [draggedDocId, setDraggedDocId] = useState(null)

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

  // Helper functions to detect file types
  const isImage = (url) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)
  }

  const isPDF = (url) => {
    return url.match(/\.pdf$/i)
  }

  const getFileType = (url) => {
    if (isImage(url)) return 'image'
    if (isPDF(url)) return 'pdf'
    return 'unknown'
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
    // Only zoom images, not PDFs
    if (isImage(imageUrl)) {
      setZoomedImage({ url: imageUrl, title })
    }
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

  // Document upload (multiple files - images or PDFs)
  const handleDocumentFilesSelect = async (e) => {
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
        return { url: data.url, name: file.name, type: file.type }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setNewDocumentFiles(prev => [...prev, ...uploadedFiles])
    } catch (error) {
      console.error('Document files upload error:', error)
      alert('Failed to upload files')
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDocumentSubmit = async () => {
    if (!newDocumentTitle.trim()) {
      alert('Please enter a document title')
      return
    }
    if (newDocumentFiles.length === 0) {
      alert('Please add at least one file')
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
          imageUrls: newDocumentFiles.map(f => f.url), // Keep the same field name for compatibility
          sortOrder: documents.length
        })
      })

      if (saveRes.ok) {
        await fetchResources()
        setNewDocumentTitle('')
        setNewDocumentFiles([])
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

  const removeDocumentFile = (index) => {
    setNewDocumentFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Drag and drop handlers for document files
  const handleDragStart = (docId, fileIndex) => {
    setDraggedFileIndex(fileIndex)
    setDraggedDocId(docId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (docId, dropIndex) => {
    if (draggedDocId !== docId || draggedFileIndex === null) return
    
    const doc = documents.find(d => d._id === docId)
    if (!doc) return

    const newFileUrls = [...doc.imageUrls]
    const [draggedUrl] = newFileUrls.splice(draggedFileIndex, 1)
    newFileUrls.splice(dropIndex, 0, draggedUrl)

    try {
      const token = getAuthToken()
      const res = await fetch('/api/campus-resources/reorder-images', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: docId,
          imageUrls: newFileUrls
        })
      })

      if (res.ok) {
        await fetchResources()
      }
    } catch (error) {
      console.error('Reorder error:', error)
      alert('Failed to reorder files')
    }

    setDraggedFileIndex(null)
    setDraggedDocId(null)
  }

  // Delete individual file from document
  const handleDeleteDocumentFile = async (docId, fileIndex) => {
    if (!confirm('Delete this file?')) return

    const doc = documents.find(d => d._id === docId)
    if (!doc) return

    const newFileUrls = doc.imageUrls.filter((_, idx) => idx !== fileIndex)

    if (newFileUrls.length === 0) {
      alert('Cannot delete the last file. Delete the entire document instead.')
      return
    }

    try {
      const token = getAuthToken()
      const res = await fetch('/api/campus-resources/reorder-images', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: docId,
          imageUrls: newFileUrls
        })
      })

      if (res.ok) {
        await fetchResources()
        alert('File deleted')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    }
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
        {/* Useful Documents Section */}
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
                  
                  {newDocumentFiles.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <p className="text-sm text-gray-600 font-medium">Selected Files ({newDocumentFiles.length}):</p>
                      {newDocumentFiles.map((file, idx) => (
                        <div key={idx} className="relative border rounded-lg p-2 flex items-center gap-3 bg-white">
                          {isImage(file.url) ? (
                            <img src={file.url} alt={`Preview ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                              <File className="text-red-600" size={32} />
                            </div>
                          )}
                          <div className="flex-1">
                            <span className="text-sm text-gray-700 font-medium block">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              {isPDF(file.url) ? 'PDF Document' : 'Image'}
                            </span>
                          </div>
                          <button
                            onClick={() => removeDocumentFile(idx)}
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
                      accept="image/*,application/pdf" 
                      multiple
                      onChange={handleDocumentFilesSelect}
                      className="hidden"
                      id="document-upload"
                      disabled={uploadingDocument}
                    />
                    <label 
                      htmlFor="document-upload"
                      className={`cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 ${uploadingDocument ? 'opacity-50' : ''}`}
                    >
                      <Plus size={18} />
                      {uploadingDocument ? 'Uploading...' : 'Add Files (Images/PDFs)'}
                    </label>
                    
                    {newDocumentFiles.length > 0 && (
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
                    
                    {/* Vertical File List with Drag & Drop */}
                    <div className="space-y-3">
                      {doc.imageUrls?.map((url, idx) => (
                        <div 
                          key={idx} 
                          className="relative group"
                          draggable={isAdmin}
                          onDragStart={() => handleDragStart(doc._id, idx)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(doc._id, idx)}
                        >
                          {isAdmin && (
                            <div className="absolute top-3 left-3 bg-black/60 text-white p-2 rounded-full z-10 cursor-move">
                              <GripVertical size={18} />
                            </div>
                          )}
                          
                          {/* Render based on file type */}
                          {isPDF(url) ? (
                            // PDF Viewer
                            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                              <div className="bg-red-50 px-4 py-2 flex items-center justify-between border-b">
                                <div className="flex items-center gap-2">
                                  <File className="text-red-600" size={20} />
                                  <span className="font-semibold text-gray-700">PDF Document - Page {idx + 1}</span>
                                </div>
                                <a 
                                  href={url} 
                                  download
                                  className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                  <Download size={16} />
                                  Download
                                </a>
                              </div>
                              <iframe 
                                src={url} 
                                className="w-full h-[600px]"
                                title={`${doc.title} - Page ${idx + 1}`}
                              />
                            </div>
                          ) : (
                            // Image Viewer
                            <div className="relative">
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
                            </div>
                          )}
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteDocumentFile(doc._id, idx)}
                              className="absolute bottom-3 right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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
                {isPDF(calendar.imageUrl) ? (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-4 py-2 flex items-center justify-between border-b">
                      <span className="font-semibold text-gray-700">Calendar PDF</span>
                      <a 
                        href={calendar.imageUrl} 
                        download
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Download size={16} />
                        Download
                      </a>
                    </div>
                    <iframe 
                      src={calendar.imageUrl} 
                      className="w-full h-[600px]"
                      title="Academic Calendar"
                    />
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
                  accept="image/*,application/pdf" 
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
                      accept="image/*,application/pdf" 
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
                    {isPDF(contact.imageUrl) ? (
                      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <div className="bg-green-50 px-4 py-2 flex items-center justify-between border-b">
                          <span className="font-semibold text-gray-700">{contact.title || `Contact Sheet ${index + 1}`}</span>
                          <a 
                            href={contact.imageUrl} 
                            download
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                          >
                            <Download size={14} />
                            Download
                          </a>
                        </div>
                        <iframe 
                          src={contact.imageUrl} 
                          className="w-full h-[400px]"
                          title={contact.title || `Contact Sheet ${index + 1}`}
                        />
                      </div>
                    ) : (
                      <>
                        <img 
                          src={contact.imageUrl} 
                          alt={contact.title || `Contact Sheet ${index + 1}`}
                          className="w-full rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleZoom(contact.imageUrl, contact.title || `Contact Sheet ${index + 1}`)}
                        />
                        <button
                          onClick={() => handleZoom(contact.imageUrl, contact.title || `Contact Sheet ${index + 1}`)}
                          className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/80"
                        >
                          <ZoomIn size={20} />
                        </button>
                      </>
                    )}
                    {contact.title && (
                      <p className="mt-2 text-sm font-semibold text-gray-700 text-center">
                        {contact.title}
                      </p>
                    )}
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
      </div>

      {/* Fixed Zoom Modal for Mobile (images only) */}
      {zoomedImage && (
        <ImageZoomModal 
          image={zoomedImage} 
          onClose={() => setZoomedImage(null)} 
        />
        )}
    </div>
  )
}