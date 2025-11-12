import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      default: 'INR'
    },
    receipt: {
      type: String
    },
    status: {
      type: String,
      required: true,
      enum: ['created', 'paid', 'failed'],
      default: 'created'
    },
    paymentId: {
      type: String
    },
    notes: {
      name: String,
      email: String,
      phone: String
    }
  },
  {
    timestamps: true
  }
)

const Order = mongoose.model('Order', orderSchema)

export default Order
