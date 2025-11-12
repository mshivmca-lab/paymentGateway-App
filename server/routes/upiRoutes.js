import express from 'express'
import {
  setupUpi,
  getUpiDetails,
  verifyUpiPin,
  makeUpiPayment,
  updateUpiPin
} from '../controllers/upiController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes are protected
router.use(protect)

// UPI setup and details
router.post('/setup', setupUpi)
router.get('/details', getUpiDetails)

// UPI PIN verification and update
router.post('/verify-pin', verifyUpiPin)
router.put('/update-pin', updateUpiPin)

// UPI payment
router.post('/pay', makeUpiPayment)

export default router
