import './globals.css'
import MobileNavbar from '@/components/MobileNavbar'

export const metadata = {
  title: 'NITC Marketplace',
  description: 'Buy, Sell & Share on Campus',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563eb',
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className="h-screen flex flex-col bg-gray-50 antialiased overflow-hidden">
        {/* Fixed Header will be inside each page (e.g. page.js) */}
        
        {/* ✅ Scrollable content */}
        <main className="flex-1 overflow-y-auto overscroll-contain h-full">
          {children}
        </main>

        {/* ✅ Fixed Bottom Navbar */}
        <MobileNavbar />
      </body>
    </html>
  )
}
