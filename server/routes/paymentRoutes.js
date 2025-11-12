import express from 'express'
import {
  createOrder,
  verifyPayment,
  getOrders,
  getPayments
} from '../controllers/paymentController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

// Protected routes - require authentication
router.post('/create-order', protect, createOrder)
router.post('/verify', verifyPayment) // No auth for webhook callback

// Protected routes with role-based access
router.get('/orders', protect, getOrders)
router.get('/payments', protect, getPayments)

export default router
