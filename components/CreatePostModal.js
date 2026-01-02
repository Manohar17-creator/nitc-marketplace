'use client'
import { useState } from 'react'
import { X, Image as ImageIcon, Link as LinkIcon, Upload, Loader2 } from 'lucide-react'

export default function CreatePostModal({ onClose, onSubmit }) {
  const [postType, setPostType] = useState('feed')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('text') // 'text', 'link', 'image'

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setUploadedImageUrl(data.url)
      setActiveTab('image')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
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
        imageUrl: activeTab === 'image' ? uploadedImageUrl : ''
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={submitting}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Type
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPostType('feed')}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  postType === 'feed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Feed
              </button>
              <button
                type="button"
                onClick={() => setPostType('job')}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  postType === 'job'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💼 Job
              </button>
              <button
                type="button"
                onClick={() => setPostType('portfolio')}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  postType === 'portfolio'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⭐ Portfolio
              </button>
            </div>
          </div>

          {/* Title (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title..."
              disabled={submitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              required
              disabled={submitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Media Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Media (Optional)
            </label>
            <div className="flex gap-2 mb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                disabled={submitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'text'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Text Only
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                disabled={submitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'link'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LinkIcon size={16} /> Link/Video
              </button>
              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'image'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${(submitting || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ImageIcon size={16} /> Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={submitting || uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Link Input */}
            {activeTab === 'link' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="Paste YouTube, Instagram, or any link..."
                  disabled={submitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  Supports: YouTube, Instagram, images, videos, and any web link
                </p>
                {embedUrl && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-800 mb-1">Preview:</p>
                    <p className="text-sm text-blue-600 break-all">{embedUrl}</p>
                    <p className="text-xs text-blue-700 mt-1">Type: {detectEmbedType(embedUrl)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Image Upload Preview */}
            {activeTab === 'image' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {uploading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-gray-600 font-medium">Uploading...</span>
                    <span className="text-xs text-gray-500 mt-1">Please wait</span>
                  </div>
                ) : uploadedImageUrl ? (
                  <div className="space-y-3">
                    <img
                      src={uploadedImageUrl}
                      alt="Upload preview"
                      className="w-full h-auto max-h-64 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImageUrl('')
                        setActiveTab('text')
                      }}
                      disabled={submitting}
                      className="text-red-600 text-sm hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center py-8 ${submitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <Upload size={48} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 font-medium">Click to upload an image</span>
                    <span className="text-xs text-gray-500 mt-1">JPG, PNG, GIF - Max 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={submitting}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || uploading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={uploading || submitting || !content.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}