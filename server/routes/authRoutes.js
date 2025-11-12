import express from 'express'
import {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  refreshToken,
  verifyEmail
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get("/verify-email/:token", verifyEmail);

// Protected routes
router.get('/me', protect, getMe)
router.put('/updatedetails', protect, updateDetails)
router.put('/updatepassword', protect, updatePassword)
router.get('/refresh-token', protect, refreshToken)

export default router
