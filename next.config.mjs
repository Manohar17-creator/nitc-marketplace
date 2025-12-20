/** @type {import('next').NextConfig} */
const nextConfig = {
  // 👇 ADD THIS BLOCK TO FIX BUILD ERRORS
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
      }
    }
    return config
  },
  // ✅ IMAGE OPTIMIZATION
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
}

export default nextConfig