import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from './config/db.js'

// Route imports
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import merchantRoutes from './routes/merchantRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import upiRoutes from './routes/upiRoutes.js'
import setupRoutes from './routes/setupRoutes.js'
import otpRoutes from './routes/otp.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'

// Load environment variables
dotenv.config()

// Connect to MongoDB
connectDB()

// Initialize Express
const app = express()

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/merchant', merchantRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/upi', upiRoutes)
app.use("/api/otp", otpRoutes);

// Development routes - should be disabled in production
if (process.env.NODE_ENV === 'development') {
  app.use('/api/setup', setupRoutes)
}

// Root route
app.get('/', (req, res) => {
  res.send('API is running...')
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})
