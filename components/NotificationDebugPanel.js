'use client'
import { useState, useEffect } from 'react'

export default function NotificationDebugPanel() {
  const [swStatus, setSwStatus] = useState('Checking...')
  const [permission, setPermission] = useState('Checking...')
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // Check initial state
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission)
      navigator.serviceWorker.getRegistrations().then(regs => {
        setSwStatus(regs.length > 0 ? `${regs.length} Active` : 'None')
      })
    }
  }, [])

  const addLog = (msg) => setLogs(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev])

  const testApiKey = async () => {
    try {
      addLog('🧪 Testing Firebase Config...')
      // Simple fetch to a public firebase endpoint to test the key
      const response = await fetch(`https://firebaseinstallations.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/installations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        },
        body: JSON.stringify({ appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID })
      })
      
      if (response.status === 400 || response.status === 403) {
         const data = await response.json()
         addLog(`❌ API KEY ERROR: ${data.error.message}`)
      } else {
         addLog('✅ API Key seems Valid (Response: ' + response.status + ')')
      }
    } catch (e) {
      addLog('❌ Test Failed: ' + e.message)
    }
  }

  const nukeServiceWorkers = async () => {
    try {
      addLog('☢️ Starting Nuclear Cleanup...')
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        await reg.unregister()
        addLog(`🗑️ Unregistered SW: ${reg.scope}`)
      }
      addLog('✅ All Service Workers killed.')
      
      if ('caches' in window) {
        const keys = await caches.keys()
        for (const key of keys) {
          await caches.delete(key)
          addLog(`🧹 Deleted Cache: ${key}`)
        }
      }
      
      addLog('🔁 RELOAD THIS PAGE NOW!')
      alert('Cleanup Done. Please Reload.')
    } catch (e) {
      addLog('❌ Error: ' + e.message)
    }
  }

  return (
    <div className="p-4 m-4 bg-gray-100 border-2 border-red-500 rounded text-xs font-mono text-black">
      <h3 className="font-bold text-red-600 mb-2">🔧 DEBUG PANEL (Remove later)</h3>
      <div className="mb-2">
        <p>Permission: <strong>{permission}</strong></p>
        <p>SW Status: <strong>{swStatus}</strong></p>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={testApiKey} className="bg-blue-600 text-white px-2 py-1 rounded">Test API Key</button>
        <button onClick={nukeServiceWorkers} className="bg-red-600 text-white px-2 py-1 rounded">☢️ NUKE CACHE</button>
      </div>
      <div className="h-24 overflow-y-auto bg-white p-2 border">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}