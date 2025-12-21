import './globals.css'
import MobileNavbar from '@/components/MobileNavbar'
import IOSInstallPrompt from '@/components/IOSInstallPrompt'
import ForegroundToast from '@/components/ForegroundToast'
import GoogleAdSense from '@/components/GoogleAdSense'
import ServiceWorkerUpdater from '@/components/ServiceWorkerUpdater' // 👈 1. Import the updater

export const metadata = {
  title: 'Unyfy',
  description: 'Where campus comes together',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Unyfy',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      
      <body className="h-screen flex flex-col bg-gray-50 antialiased overflow-hidden">
        
        {/* 2. Add the Updater here. It runs silently in the background. */}
        <ServiceWorkerUpdater />
        
        <GoogleAdSense pId="ca-pub-2297395818809684" />

        <IOSInstallPrompt />

        <ForegroundToast />
        
        <main className="flex-1 overflow-y-auto overscroll-contain pb-nav-safe">
          {children}
        </main>
        
        <MobileNavbar />
      </body>
    </html>
  )
}