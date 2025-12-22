import './globals.css'
import Link from 'next/link'
import MobileNavbar from '@/components/MobileNavbar'
import IOSInstallPrompt from '@/components/IOSInstallPrompt'
import ForegroundToast from '@/components/ForegroundToast'
import GoogleAdSense from '@/components/GoogleAdSense'
import ServiceWorkerUpdater from '@/components/ServiceWorkerUpdater'

export const metadata = {
  title: 'Unyfy',
  description: 'Where campus comes together',
  manifest: '/manifest.json',
  
  verification: {
    google: '2dP_WjCJK3z_YknGuSNZ02TqTY9UEWDETPiIsBsk6Ag', 
  },

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
        
        <ServiceWorkerUpdater />
        <GoogleAdSense pId="ca-pub-2297395818809684" />
        <IOSInstallPrompt />
        <ForegroundToast />
        
        <main className="flex-1 overflow-y-auto pb-nav-safe">
          {children}

          {/* ✅ COMPACT FOOTER: Reduced 'py-6' to 'py-2' */}
         <div className="mt-0 text-center text-[10px] leading-none text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600 underline">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/terms" className="hover:text-gray-600 underline">
              Terms & Conditions
            </Link>
          </div>


        </main>
        
        <MobileNavbar />
      </body>
    </html>
  )
}