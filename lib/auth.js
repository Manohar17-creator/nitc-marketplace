import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12)
}

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

// ✅ UPDATED: Added 'expiresIn' parameter (Default = 30 days)
export const generateToken = (userId, expiresIn = '30d') => {
  // Ensure userId is a string to prevent MongoDB ObjectId issues
  return jwt.sign(
    { userId: userId.toString() }, 
    process.env.JWT_SECRET, 
    { expiresIn }
  )
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

export const isNITCEmail = (email) => {
  return email.endsWith('@nitc.ac.in')
}