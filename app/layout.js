// app/layout.js
import './globals.css'
import MobileNavbar from '@/components/MobileNavbar'

export const metadata = {
  title: 'NITC Marketplace',
  description: 'Buy, Sell & Share on Campus',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-screen flex flex-col bg-gray-50 antialiased overflow-hidden">
        {/* main is the only scrollable element */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>

        {/* MobileNavbar is fixed + outside main */}
        <MobileNavbar />
      </body>
    </html>
  )
}
