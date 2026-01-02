import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert to buffer for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ✅ UPLOAD USING STREAMS (More memory efficient for 400+ users)
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: 'nitc-marketplace',
        resource_type: 'image', // Explicitly image
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' }, // Matches your frontend logic
          { quality: 'auto', fetch_format: 'auto' } // Auto-converts to WebP for speed
        ]
      }, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }).end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id
    })

  } catch (error) {
    console.error('Cloudinary Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}