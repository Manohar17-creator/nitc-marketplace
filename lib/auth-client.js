// lib/auth-client.js - Complete client-side auth utilities

// ============================================
// TOKEN MANAGEMENT
// ============================================

export function getAuthToken() {
  const localToken = localStorage.getItem('token')
  if (localToken) return localToken

  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1]
  
  if (cookieToken) {
    localStorage.setItem('token', cookieToken)
    return cookieToken
  }

  return null
}

// ============================================
// USER DATA MANAGEMENT
// ============================================

export function getUserData() {
  // Try localStorage first
  const localUser = localStorage.getItem('user')
  if (localUser) {
    try {
      return JSON.parse(localUser)
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e)
    }
  }

  // Try cookies (Google OAuth)
  const cookieUser = document.cookie
    .split('; ')
    .find(row => row.startsWith('user_data='))
    ?.split('=')[1]
  
  if (cookieUser) {
    try {
      const user = JSON.parse(decodeURIComponent(cookieUser))
      localStorage.setItem('user', JSON.stringify(user))
      return user
    } catch (e) {
      console.error('Failed to parse user from cookie:', e)
    }
  }

  return null
}

export function getStoredUser() {
  return getUserData()
}

export function setStoredUser(user) {
  try {
    localStorage.setItem('user', JSON.stringify(user))
  } catch (error) {
    console.error('Failed to store user:', error)
  }
}

export function setAuthData(token, user) {
  try {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  } catch (error) {
    console.error('Failed to store auth data:', error)
  }
}

// ============================================
// AUTHENTICATION CHECKS
// ============================================

export function isAuthenticated() {
  return !!getAuthToken()
}

export function requireAuth(router) {
  if (!isAuthenticated()) {
    router.push('/login')
    return false
  }
  return true
}

// ============================================
// LOGOUT
// ============================================

export function logout() {
  // Clear localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('cached_subjects')
  localStorage.removeItem('cached_stats')
  
  // Clear cookies
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = 'user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// ============================================
// API HELPERS
// ============================================

export function getAuthHeaders() {
  const token = getAuthToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error('No authentication token found')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  // Auto-logout on 401
  if (response.status === 401) {
    logout()
    throw new Error('Session expired')
  }

  return response
}