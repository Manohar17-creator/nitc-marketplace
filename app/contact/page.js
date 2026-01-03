'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, MessageSquare, AlertCircle } from 'lucide-react'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const token = getAuthToken() // Optional: if you want to know WHO sent it
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        alert('Message sent! We will get back to you soon.')
        router.back()
      } else {
        alert('Failed to send message.')
      }
    } catch (error) {
      console.error(error)
      alert('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white z-10 shadow-sm border-b safe-top">
        <div className="max-w-2xl mx-auto h-[60px] flex items-center px-4 gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Contact Support</h1>
        </div>
      </div>

      <div className="pt-[80px] pb-8 px-4 max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 text-blue-600 bg-blue-50 p-4 rounded-lg">
            <MessageSquare size={24} />
            <p className="text-sm font-medium">
              Have a suggestion, found a bug, or just want to say hi? Send us a message below!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
              <select 
                className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                required
              >
                <option value="">Select a topic...</option>
                <option value="Bug Report">🐛 Bug Report</option>
                <option value="Feature Request">💡 Feature Request</option>
                <option value="Account Issue">🔐 Account Issue</option>
                <option value="Other">📝 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full p-3 border rounded-lg h-32 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Type your message here..."
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                required
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : <><Send size={18} /> Send Message</>}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
  <p className="text-gray-500 text-sm mb-2">Or email us directly at</p>
  <a 
    href="https://mail.google.com/mail/?view=cm&fs=1&to=support@unyfy.in" 
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 font-bold hover:underline"
  >
    support@unyfy.in
  </a>
</div>
      </div>
    </div>
  )
}