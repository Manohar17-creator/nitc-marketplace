'use client'
import Script from 'next/script'

export default function GoogleAdSense({ pId }) {
  if (!pId) return null

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pId}`}
      crossOrigin="anonymous"
      onError={(e) => { console.error('Script failed to load', e) }}
    />
  )
}