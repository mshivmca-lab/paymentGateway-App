import crypto from 'crypto'
import razorpay from '../config/razorpay.js'
import Order from '../models/Order.js'
import Payment from '../models/Payment.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'

// Create a new Razorpay order
export const createOrder = async (req, res) => {
  try {
    console.log('Create order request received:', req.body);
    console.log('User ID from request:', req.user?.id);

    const { amount, currency = 'INR', receipt, notes } = req.body

    // Validate input
    if (!amount || amount < 100) {
      console.log('Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least 100 (₹1)'
      })
    }

    // Create order in Razorpay
    // Ensure amount is an integer (Razorpay requires amount in paise as integer)
    const amountInt = parseInt(amount, 10);

    if (isNaN(amountInt)) {
      console.error('Invalid amount format:', amount);
      return res.status(400).json({
        success: false,
        error: 'Amount must be a valid number'
      });
    }

    const options = {
      amount: amountInt,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes
    }

    console.log('Razorpay order options:', options);

    try {
      const order = await razorpay.orders.create(options)
      console.log('Razorpay order created successfully:', order.id);

      // Save order in database with user reference
      await Order.create({
        razorpayOrderId: order.id,
        user: req.user.id, // Add user reference
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: 'created',
        notes
      })

      console.log('Order saved to database');

      res.status(200).json({
        success: true,
        order
      })
    } catch (razorpayError) {
      console.error('Razorpay API error:', razorpayError);
      console.error('Razorpay error details:', razorpayError.error || razorpayError.message);

      return res.status(500).json({
        success: false,
        error: 'Failed to create Razorpay order',
        details: razorpayError.error?.description || razorpayError.message
      });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Something went wrong',
      message: error.message
    })
  }
}

// Verify Razorpay payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      })
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      // Get payment details from Razorpay
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id)

      // Update order status
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: 'paid',
          paymentId: razorpay_payment_id
        }
      )

      // Get the order to get the user reference
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id })

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        })
      }

      // Save payment details with user reference
      const payment = await Payment.create({
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        user: order.user, // Add user reference from the order
        razorpaySignature: razorpay_signature,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        status: paymentDetails.status,
        method: paymentDetails.method,
        email: paymentDetails.email,
        contact: paymentDetails.contact
      })

      try {
        // Generate transaction ID
        const transactionId = `PAY${Date.now()}${crypto.randomBytes(4).toString('hex')}`

        // Update user's balance
        const user = await User.findById(order.user)
        if (user) {
          user.balance += paymentDetails.amount / 100 // Convert from paise to rupees
          await user.save()

          // Create transaction record
          await Transaction.create({
            transactionId,
            sender: order.user, // User making the payment
            receiver: order.user, // Same user receiving the credit
            amount: paymentDetails.amount / 100, // Convert from paise to rupees
            type: 'deposit',
            status: 'completed',
            description: 'Payment deposit via Razorpay',
            paymentId: razorpay_payment_id,
            metadata: {
              orderId: razorpay_order_id,
              method: paymentDetails.method
            }
          })
        }
      } catch (err) {
        console.error('Error updating balance:', err)
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid signature'
      })
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    res.status(500).json({
      success: false,
      error: 'Something went wrong'
    })
  }
}

// Get all orders - Admin sees all, users/merchants see only their own
export const getOrders = async (req, res) => {
  try {
    let query = {};

    // If not admin, only show user's own orders
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({
      success: false,
      error: 'Something went wrong'
    })
  }
}

// Get all payments - Admin sees all, users/merchants see only their own
export const getPayments = async (req, res) => {
  try {
    let query = {};

    // If not admin, only show user's own payments
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    res.status(500).json({
      success: false,
      error: 'Something went wrong'
    })
  }
}
