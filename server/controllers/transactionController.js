import mongoose from 'mongoose'
import crypto from 'crypto'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'

// @desc    Get user's transaction history
// @route   GET /api/transactions
// @access  Private
export const getTransactionHistory = async (req, res) => {
  try {
    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const userId = req.user.id

    // Build query
    const query = {
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }

    // Apply date filter if provided
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      }
    }

    // Apply type filter if provided
    if (req.query.type) {
      query.type = req.query.type
    }

    // Apply status filter if provided
    if (req.query.status) {
      query.status = req.query.status
    }

    // Count total documents
    const total = await Transaction.countDocuments(query)

    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)

    // Prepare response with pagination info
    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: transactions
    })
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Get transaction details
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      transactionId: req.params.id,
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      })
    }

    res.status(200).json({
      success: true,
      data: transaction
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Transfer money to another user
// @route   POST /api/transactions/transfer
// @access  Private
export const transferMoney = async (req, res) => {
  try {
    const { receiverEmail, amount, description } = req.body
    const senderId = req.user.id

    // Validate input
    if (!receiverEmail || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide receiver email and amount'
      })
    }

    // Convert amount to number and validate
    const transferAmount = Number(amount)
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      })
    }

    // Find sender
    const sender = await User.findById(senderId)
    if (!sender) {
      return res.status(404).json({
        success: false,
        error: 'Sender not found'
      })
    }

    // Check if sender has sufficient balance
    if (sender.balance < transferAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      })
    }

    // Find receiver by email
    const receiver = await User.findOne({ email: receiverEmail })
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      })
    }

    // Prevent self-transfer
    if (sender._id.toString() === receiver._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer money to yourself'
      })
    }

    // Generate transaction ID
    const transactionId = `TRX${Date.now()}${crypto.randomBytes(4).toString('hex')}`

    // Update sender's balance
    sender.balance -= transferAmount
    await sender.save()

    // Update receiver's balance
    receiver.balance += transferAmount
    await receiver.save()

    // Create transaction record
    await Transaction.create({
      transactionId,
      sender: sender._id,
      receiver: receiver._id,
      amount: transferAmount,
      type: 'transfer',
      status: 'completed',
      description: description || 'Money transfer'
    })

    res.status(200).json({
      success: true,
      message: 'Transfer successful',
      data: {
        transactionId,
        amount: transferAmount,
        receiver: {
          name: receiver.name,
          email: receiver.email
        },
        date: new Date()
      }
    })
  } catch (error) {
    console.error('Error transferring money:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Get user's balance
// @route   GET /api/transactions/balance
// @access  Private
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('balance')

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        balance: user.balance
      }
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}
