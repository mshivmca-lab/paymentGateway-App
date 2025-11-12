import express from 'express'
import User from '../models/User.js'
import bcrypt from 'bcryptjs'

const router = express.Router()

// @desc    Create admin user (development only)
// @route   POST /api/setup/create-admin
// @access  Public
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if admin already exists
    const adminExists = await User.findOne({ email })
    if (adminExists) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      balance: 10000 // Give admin some initial balance
    })

    // Remove password from response
    admin.password = undefined

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: admin
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
})

export default router
