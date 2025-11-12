import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  let token

  // Check for token in cookies, headers or query params
  if (
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
  ) {
    token = req.cookies.token || req.headers.authorization.split(' ')[1]
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    })
  }

  try {
    // Verify token
    console.log(`Verifying token for route: ${req.originalUrl}`)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // console.log(`Token verified successfully. User ID: ${decoded.id}`)

    // Add user to request object
    req.user = await User.findById(decoded.id)

    if (!req.user) {
      console.error(`User not found for ID: ${decoded.id}`)
      return res.status(401).json({
        success: false,
        error: 'User not found'
      })
    }

    next()
  } catch (error) {
    console.error(`Token verification failed: ${error.message}`)
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    })
  }
}

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      })
    }

    next()
  }
}
