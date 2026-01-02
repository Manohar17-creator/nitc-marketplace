'use client'
import { useState } from 'react'
import { X, Image as ImageIcon, Link as LinkIcon, Upload, Loader2, Trash2 } from 'lucide-react'

export default function CreatePostModal({ onClose, onSubmit }) {
  const [postType, setPostType] = useState('feed')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  
  const [uploadedImages, setUploadedImages] = useState([]) 
  
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('text') 

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (uploadedImages.length + files.length > 5) {
      alert('You can only upload up to 5 images per post.')
      return
    }

    setUploading(true)
    
    try {
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed')
        if (file.size > 5 * 1024 * 1024) throw new Error(`Image ${file.name} is too large (max 5MB)`)

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        return data.url
      })

      const newUrls = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...newUrls])

    } catch (error) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload images.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      alert('Please write something')
      return
    }

    setSubmitting(true)
    try {
      const postData = {
        type: postType,
        title: title.trim(),
        content: content.trim(),
        embedUrl: activeTab === 'link' ? embedUrl.trim() : '',
        embedType: activeTab === 'link' ? detectEmbedType(embedUrl) : '',
        imageUrls: activeTab === 'image' ? uploadedImages : [], 
        imageUrl: activeTab === 'image' && uploadedImages.length > 0 ? uploadedImages[0] : '' 
      }

      await onSubmit(postData)
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const detectEmbedType = (url) => {
    if (!url) return 'link'
    if (/(?:youtube\.com|youtu\.be)/.test(url)) return 'youtube'
    if (/instagram\.com/.test(url)) return 'instagram'
    if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)) return 'image'
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return 'video'
    return 'link'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4 pb-safe">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative mb-16 sm:mb-0">
        
        {/* Header */}
        <div className="flex-shrink-0 border-b px-6 py-4 flex items-center justify-between bg-white rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1" disabled={submitting}>
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
            <div className="flex gap-2 flex-wrap">
              {['feed', 'job', 'portfolio'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                    postType === type
                      ? type === 'job' ? 'bg-orange-600 text-white' : type === 'portfolio' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'job' ? '💼 Job' : type === 'portfolio' ? '⭐ Portfolio' : 'Feed'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title..."
              disabled={submitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              required
              disabled={submitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Media Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Media (Optional)</label>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'text' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Text Only
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                disabled={submitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'link' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LinkIcon size={16} /> Link
              </button>

              {/* ✅ UPDATED: Changed from label/input to simple button */}
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                disabled={submitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'image' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ImageIcon size={16} /> Photos
              </button>
            </div>

            {/* Link Input View */}
            {activeTab === 'link' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="Paste URL here..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            {/* Image Preview View */}
            {activeTab === 'image' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                
                {/* Upload Loading State */}
                {uploading && (
                  <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Loader2 className="animate-spin text-blue-600 mr-2" size={20} />
                    <span className="text-sm text-blue-700 font-medium">Uploading images...</span>
                  </div>
                )}

                {/* Image Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {/* ✅ "Add More" Button / Initial Upload Box */}
                  {uploadedImages.length < 5 && !uploading && (
                    <label className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${uploadedImages.length === 0 ? 'h-32 col-span-2 sm:col-span-3' : 'aspect-square'}`}>
                      <Upload size={uploadedImages.length === 0 ? 32 : 24} className="text-gray-400 mb-1" />
                      <span className={`text-gray-500 ${uploadedImages.length === 0 ? 'text-sm font-medium' : 'text-xs'}`}>
                        {uploadedImages.length === 0 ? 'Click to upload photos' : 'Add'}
                      </span>
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 flex gap-3 bg-white rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || !content.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}