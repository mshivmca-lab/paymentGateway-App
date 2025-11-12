import User from '../models/User.js'
import crypto from 'crypto'
import Transaction from '../models/Transaction.js'

// @desc    Create or update UPI ID for user
// @route   POST /api/upi/setup
// @access  Private
export const setupUpi = async (req, res) => {
  try {
    const { customUpiId, pin } = req.body
    const userId = req.user.id

    // Validate PIN
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be a 4-digit number'
      })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Generate or use custom UPI ID
    let upiId
    if (customUpiId) {
      // Validate custom UPI ID format
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$/
      if (!upiRegex.test(customUpiId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid UPI ID format'
        })
      }

      // Check if UPI ID is already taken
      const existingUser = await User.findOne({ upiId: customUpiId })
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          error: 'UPI ID already taken'
        })
      }

      upiId = customUpiId
    } else {
      // Generate UPI ID
      upiId = user.generateUpiId()
    }

    // Update user with UPI ID and PIN
    user.upiId = upiId
    user.upiPin = pin
    user.hasSetupUpi = true
    await user.save()

    res.status(200).json({
      success: true,
      data: {
        upiId: user.upiId,
        hasSetupUpi: user.hasSetupUpi
      }
    })
  } catch (error) {
    console.error('Error setting up UPI:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Get user's UPI details
// @route   GET /api/upi/details
// @access  Private
export const getUpiDetails = async (req, res) => {
  try {
    const userId = req.user.id

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        upiId: user.upiId,
        hasSetupUpi: user.hasSetupUpi
      }
    })
  } catch (error) {
    console.error('Error getting UPI details:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Verify UPI PIN
// @route   POST /api/upi/verify-pin
// @access  Private
export const verifyUpiPin = async (req, res) => {
  try {
    const { pin } = req.body
    const userId = req.user.id

    // Validate PIN
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be a 4-digit number'
      })
    }

    // Find user with UPI PIN
    const user = await User.findById(userId).select('+upiPin')
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Check if UPI is set up
    if (!user.hasSetupUpi || !user.upiId || !user.upiPin) {
      return res.status(400).json({
        success: false,
        error: 'UPI not set up'
      })
    }

    // Verify PIN
    const isMatch = await user.matchUpiPin(pin)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      })
    }

    res.status(200).json({
      success: true,
      message: 'PIN verified successfully'
    })
  } catch (error) {
    console.error('Error verifying UPI PIN:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Make UPI payment
// @route   POST /api/upi/pay
// @access  Private
export const makeUpiPayment = async (req, res) => {
  try {
    const { receiverUpiId, amount, pin, description } = req.body
    const senderId = req.user.id

    // Validate input
    if (!receiverUpiId || !amount || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Please provide receiver UPI ID, amount, and PIN'
      })
    }

    // Convert amount to number and validate
    const paymentAmount = Number(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      })
    }

    // Find sender with UPI PIN
    const sender = await User.findById(senderId).select('+upiPin')
    if (!sender) {
      return res.status(404).json({
        success: false,
        error: 'Sender not found'
      })
    }

    // Check if sender has UPI set up
    if (!sender.hasSetupUpi || !sender.upiId || !sender.upiPin) {
      return res.status(400).json({
        success: false,
        error: 'UPI not set up'
      })
    }

    // Verify PIN
    const isMatch = await sender.matchUpiPin(pin)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      })
    }

    // Check if sender has sufficient balance
    if (sender.balance < paymentAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      })
    }

    // Find receiver by UPI ID
    const receiver = await User.findOne({ upiId: receiverUpiId })
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      })
    }

    // Prevent self-payment
    if (sender._id.toString() === receiver._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer money to yourself'
      })
    }

    // Generate transaction ID
    const transactionId = `UPI${Date.now()}${crypto.randomBytes(4).toString('hex')}`

    // Update sender's balance
    sender.balance -= paymentAmount
    await sender.save()

    // Update receiver's balance
    receiver.balance += paymentAmount
    await receiver.save()

    // Create transaction record
    await Transaction.create({
      transactionId,
      sender: sender._id,
      receiver: receiver._id,
      amount: paymentAmount,
      type: 'payment',
      status: 'completed',
      description: description || 'UPI Payment',
      metadata: {
        method: 'UPI',
        senderUpiId: sender.upiId,
        receiverUpiId: receiver.upiId
      }
    })

    res.status(200).json({
      success: true,
      message: 'Payment successful',
      data: {
        transactionId,
        amount: paymentAmount,
        receiver: {
          name: receiver.name,
          upiId: receiver.upiId
        },
        date: new Date()
      }
    })
  } catch (error) {
    console.error('Error making UPI payment:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Update UPI PIN
// @route   PUT /api/upi/update-pin
// @access  Private
export const updateUpiPin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body
    const userId = req.user.id

    // Validate PINs
    if (!currentPin || !newPin || currentPin.length !== 4 || newPin.length !== 4 || 
        !/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        error: 'PINs must be 4-digit numbers'
      })
    }

    // Find user with UPI PIN
    const user = await User.findById(userId).select('+upiPin')
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Check if UPI is set up
    if (!user.hasSetupUpi || !user.upiId || !user.upiPin) {
      return res.status(400).json({
        success: false,
        error: 'UPI not set up'
      })
    }

    // Verify current PIN
    const isMatch = await user.matchUpiPin(currentPin)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current PIN is incorrect'
      })
    }

    // Update PIN
    user.upiPin = newPin
    await user.save()

    res.status(200).json({
      success: true,
      message: 'UPI PIN updated successfully'
    })
  } catch (error) {
    console.error('Error updating UPI PIN:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}
