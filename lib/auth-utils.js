export function getStoredUser() {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null

    // Try to parse directly first (for regular JWT auth)
    try {
      return JSON.parse(userStr)
    } catch {
      // If that fails, try decoding first (for Google OAuth)
      const decodedUserStr = decodeURIComponent(userStr)
      return JSON.parse(decodedUserStr)
    }
  } catch (error) {
    console.error('Failed to get stored user:', error)
    // Clear corrupted data
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }
}

export function setStoredUser(user) {
  try {
    localStorage.setItem('user', JSON.stringify(user))
  } catch (error) {
    console.error('Failed to store user:', error)
  }
}