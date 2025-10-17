import './globals.css'

export const metadata = {
  title: 'NITC Marketplace',
  description: 'Buy, Sell & Share on Campus',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#2563eb',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}