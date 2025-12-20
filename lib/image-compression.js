import imageCompression from 'browser-image-compression'

export async function compressImage(file) {
  const options = {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/jpeg',
  }

  try {
    console.log('📦 Original:', (file.size / 1024 / 1024).toFixed(2), 'MB')
    const compressedFile = await imageCompression(file, options)
    console.log('✅ Compressed:', (compressedFile.size / 1024).toFixed(2), 'KB')
    return compressedFile
  } catch (error) {
    console.error('Compression failed:', error)
    return file
  }
}