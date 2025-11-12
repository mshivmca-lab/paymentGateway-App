import express from 'express'
import {
  getMerchantDashboard,
  getMerchantOrders,
  getMerchantPayments
} from '../controllers/merchantController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes are protected and restricted to merchants
router.use(protect)
router.use(authorize('merchant', 'admin'))

router.get('/dashboard', getMerchantDashboard)
router.get('/orders', getMerchantOrders)
router.get('/payments', getMerchantPayments)

export default router
