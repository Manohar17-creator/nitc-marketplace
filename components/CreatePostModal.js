import { useState } from 'react'
import { Send, X } from 'lucide-react'

export default function CreatePostModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'feed',
    title: '',
    content: '',
    embedUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Pass the data back to parent component
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err.message || 'Failed to post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-lg max-h-[90vh] flex flex-col relative">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-20 rounded-t-lg">
          <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 pb-32 sm:pb-6">
          <form id="create-post-form" onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Post Type */}
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                Post Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="feed">Feed Post (Everyone can see)</option>
                <option value="job">Job/Collaboration (Everyone can see)</option>
                <option value="portfolio">Portfolio (Only visible in your profile)</option>
              </select>
            </div>

            {/* Title (for jobs and portfolio) */}
            {(formData.type === 'job' || formData.type === 'portfolio') && (
              <div className="mb-4">
                <label className="block text-gray-900 font-semibold mb-2 text-sm">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={formData.type === 'job' ? 'e.g., Need Video Editor' : 'e.g., My Latest Project'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            )}

            {/* Content */}
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={5}
                placeholder="Write your post..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
              />
            </div>

            {/* Embed URL */}
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2 text-sm">
                Link (Optional)
              </label>
              <input
                type="url"
                value={formData.embedUrl}
                onChange={(e) => setFormData({ ...formData, embedUrl: e.target.value })}
                placeholder="YouTube, Instagram, or any link..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste YouTube or Instagram link to embed
              </p>
            </div>
          </form>
        </div>

        {/* Fixed Footer Button - Identical to Add Subject Logic */}
        <div 
          className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-0 right-0 px-4 pt-2 pb-2 bg-white border-t border-gray-100 sm:static sm:p-4 sm:border-0 z-50"
        >
          <button
            type="submit"
            form="create-post-form" // This links the button to the form above
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Posting...
              </>
            ) : (
              <>
                <Send size={20} />
                Post
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}