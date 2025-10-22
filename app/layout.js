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
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2563eb" />
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" 
        />
        <meta 
          name="theme-color" 
          content="rgb(249 250 251)"
          media="(prefers-color-scheme: light)"
        />
        <meta 
          name="theme-color" 
          content="rgb(249 250 251)"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className="antialiased h-full bg-gray-50">
        {children}
        <MobileNavbar />
      </body>
    </html>
  )
}