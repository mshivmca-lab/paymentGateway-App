import Order from '../models/Order.js'
import Payment from '../models/Payment.js'

// @desc    Get merchant dashboard stats
// @route   GET /api/merchant/dashboard
// @access  Private/Merchant
export const getMerchantDashboard = async (req, res) => {
  try {
    // Get merchant's orders
    const orders = await Order.find({ user: req.user.id })
    
    // Get merchant's payments
    const payments = await Payment.find({ user: req.user.id })
    
    // Calculate total revenue
    const totalRevenue = payments
      .filter(payment => payment.status === 'captured')
      .reduce((sum, payment) => sum + payment.amount, 0) / 100 // Convert from paise to rupees
    
    // Calculate pending amount
    const pendingAmount = orders
      .filter(order => order.status === 'created')
      .reduce((sum, order) => sum + order.amount, 0) / 100 // Convert from paise to rupees
    
    // Get payment counts by status
    const paymentStatusCounts = {
      captured: payments.filter(payment => payment.status === 'captured').length,
      failed: payments.filter(payment => payment.status === 'failed').length,
      refunded: payments.filter(payment => payment.status === 'refunded').length
    }
    
    // Get order counts by status
    const orderStatusCounts = {
      created: orders.filter(order => order.status === 'created').length,
      paid: orders.filter(order => order.status === 'paid').length,
      failed: orders.filter(order => order.status === 'failed').length
    }
    
    // Get recent orders
    const recentOrders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
    
    // Get recent payments
    const recentPayments = await Payment.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
    
    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        pendingAmount,
        totalOrders: orders.length,
        totalPayments: payments.length,
        paymentStatusCounts,
        orderStatusCounts,
        recentOrders,
        recentPayments
      }
    })
  } catch (error) {
    console.error('Error getting merchant dashboard:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Get merchant orders
// @route   GET /api/merchant/orders
// @access  Private/Merchant
export const getMerchantOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    })
  } catch (error) {
    console.error('Error getting merchant orders:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}

// @desc    Get merchant payments
// @route   GET /api/merchant/payments
// @access  Private/Merchant
export const getMerchantPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    })
  } catch (error) {
    console.error('Error getting merchant payments:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
}
