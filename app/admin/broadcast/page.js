'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Send, Bell } from 'lucide-react'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function BroadcastPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', message: '', type: 'info' })
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to send this to ALL users?')) return

    setLoading(true)
    try {
      const token = getAuthToken()
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      credentials: 'include',
        body: JSON.stringify(form)
      })

      if (res.ok) {
        alert('Broadcast Sent! 🚀')
        router.push('/admin/dashboard')
      } else {
        alert('Failed to send')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="hover:bg-white/10 p-1 rounded-full"><ChevronLeft /></button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Bell size={20} /> Broadcast Notification</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 mt-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Warning:</strong> This message will be sent to <strong>every registered user</strong> immediately. Use this for important announcements only.
            </p>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Notification Title</label>
              <input 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Server Maintenance / Diwali Fest"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-1">Message</label>
              <textarea 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                placeholder="Type your message here..."
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Type</label>
              <div className="flex gap-4">
                {['info', 'success', 'warning', 'error'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      checked={form.type === t}
                      onChange={() => setForm({...form, type: t})}
                    />
                    <span className="capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : <><Send size={18} /> Send Broadcast</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}