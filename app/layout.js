import './globals.css'
import MobileNavbar from '@/components/MobileNavbar'
import IOSInstallPrompt from '@/components/IOSInstallPrompt' // Make sure you created this file from our previous steps
import ForegroundToast from '@/components/ForegroundToast'
import GoogleAdSense from '@/components/GoogleAdSense'

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
        
        <GoogleAdSense pId="ca-pub-2297395818809684" />

        {/* 1. iOS PWA Install Prompt (Only shows on iPhone web) */}
        <IOSInstallPrompt />

        <ForegroundToast />
        
        {/* 2. Main Content */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-nav-safe">
          {children}
        </main>
        
        {/* 3. Bottom Navigation */}
        <MobileNavbar />
      </body>
    </html>
  )
}