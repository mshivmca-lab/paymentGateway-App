import express from 'express'
import {
  getTransactionHistory,
  getTransactionById,
  transferMoney,
  getBalance
} from '../controllers/transactionController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes are protected
router.use(protect)

// Get transaction history and balance
router.get('/', getTransactionHistory)
router.get('/balance', getBalance)

// Get transaction by ID
router.get('/:id', getTransactionById)

// Transfer money
router.post('/transfer', transferMoney)

export default router
