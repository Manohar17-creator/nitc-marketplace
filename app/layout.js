import './globals.css'
import Link from 'next/link'
import MobileNavbar from '@/components/MobileNavbar'
import IOSInstallPrompt from '@/components/IOSInstallPrompt'
import ForegroundToast from '@/components/ForegroundToast'
import GoogleAdSense from '@/components/GoogleAdSense'
import ServiceWorkerUpdater from '@/components/ServiceWorkerUpdater'
import NotificationManager from '@/components/NotificationManager'
import Script from 'next/script' // ✅ Required for Schema
import NotificationAutoPrompt from '@/components/NotificationAutoPrompt'

export const metadata = {
  title: {
    default: 'Unyfy: Campus Life Simplified',
    template: '%s | Unyfy'
  },
  description: 'The exclusive campus marketplace for NIT Calicut. Buy, sell, track attendance, and stay connected with the NITC community.',
  manifest: '/manifest.json',
  keywords: ['NIT Calicut', 'NITC', 'Campus Marketplace', 'Attendance Tracker', 'Lost and Found', 'Calicut University'],
  openGraph: {
    title: 'Unyfy | Where NITC Campus Comes Together',
    description: 'Join the exclusive NIT Calicut community marketplace.',
    url: 'https://www.unyfy.in',
    siteName: 'Unyfy',
    locale: 'en_IN',
    type: 'website',
  },
  verification: {
    google: '2dP_WjCJK3z_YknGuSNZ02TqTY9UEWDETPiIsBsk6Ag', 
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Unyfy',
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
      <head>
        {/* ✅ LOGO SCHEMA: Tells Google specifically which image is your logo */}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Unyfy",
              "url": "https://www.unyfy.in",
              "logo": "https://www.unyfy.in/icon-512.png" 
            })
          }}
        />
      </head>
      <body className="h-screen flex flex-col bg-gray-50 antialiased overflow-hidden">
        
        <ServiceWorkerUpdater />
        <GoogleAdSense pId="ca-pub-2297395818809684" />
        <IOSInstallPrompt />
        <ForegroundToast />
        <NotificationManager />
        <NotificationAutoPrompt />
        
        <main className="flex-1 overflow-y-auto pb-nav-safe">
          {children}

          <div className="mt-4 mb-4 text-center text-[10px] leading-none text-gray-400">
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