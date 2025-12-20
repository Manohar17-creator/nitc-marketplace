'use client'
import { useState, useEffect } from 'react'
import { Share, PlusSquare, X } from 'lucide-react'

export default function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // 1. Detect if device is iOS (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)

    // 2. Detect if app is already running in "standalone" (installed) mode
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone) 
      || window.matchMedia('(display-mode: standalone)').matches

    setIsIOS(isIosDevice)
    setIsStandalone(isInStandaloneMode)

    // 3. Show prompt ONLY if: It is iOS AND It is NOT installed
    if (isIosDevice && !isInStandaloneMode) {
      // Check if user previously dismissed it to avoid annoyance
      const hasDismissed = localStorage.getItem('iosPromptDismissed')
      if (!hasDismissed) {
        // Small delay so it doesn't pop up instantly on load
        const timer = setTimeout(() => setShowPrompt(true), 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('iosPromptDismissed', 'true')
  }

  // If not iOS, or already installed, or prompt hidden -> Render nothing
  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 animate-in slide-in-from-bottom-full duration-700">
      {/* Glassmorphism Container */}
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-5 max-w-md mx-auto relative">
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100/80 rounded-full active:scale-95 transition-all"
        >
          <X size={16} />
        </button>

        <div className="flex gap-4 items-start">
          {/* App Icon Preview */}
          <div className="flex-shrink-0">
             {/* Ensure '/icon-192x192.png' exists in your public folder */}
            <img 
              src="/icon-192x192.png" 
              alt="App Icon" 
              className="w-16 h-16 rounded-xl shadow-lg border border-gray-100" 
              onError={(e) => { e.target.style.display = 'none' }} // Hide if missing
            />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">Install App</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Install <strong>NITC Marketplace</strong> on your Home Screen for the best experience and notifications.
            </p>
            
            {/* Instructions */}
            <div className="space-y-3 text-sm font-medium text-blue-700">
              <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-lg">
                <span className="flex items-center justify-center w-6 h-6 bg-white rounded shadow-sm text-gray-600 font-bold text-xs border border-gray-100">1</span>
                <span>Tap the <Share size={16} className="inline mx-1 text-blue-600" /> Share button</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-lg">
                <span className="flex items-center justify-center w-6 h-6 bg-white rounded shadow-sm text-gray-600 font-bold text-xs border border-gray-100">2</span>
                <span>Select <PlusSquare size={16} className="inline mx-1 text-blue-600" /> Add to Home Screen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Triangle Pointer (Pointing to bottom center) */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 backdrop-blur-xl rotate-45 border-r border-b border-gray-200"></div>
      </div>
    </div>
  )
}