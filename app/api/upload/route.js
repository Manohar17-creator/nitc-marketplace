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

    // Get file type
    const fileType = file.type
    const isImage = fileType.startsWith('image/')
    const isPDF = fileType === 'application/pdf'

    // Validate file type
    if (!isImage && !isPDF) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images and PDFs are allowed.' 
      }, { status: 400 })
    }

    // Convert to buffer for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload configuration based on file type
    const uploadConfig = {
      folder: 'nitc-marketplace',
      resource_type: isPDF ? 'raw' : 'image', // 'raw' for PDFs, 'image' for images
    }

    // Only add transformations for images
    if (isImage) {
      uploadConfig.transformation = [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }

    // ✅ UPLOAD USING STREAMS (More memory efficient for 400+ users)
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadConfig,
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      fileType: isPDF ? 'pdf' : 'image' // Optional: helps frontend identify file type
    })

  } catch (error) {
    console.error('Cloudinary Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}