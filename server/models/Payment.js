import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true
    },
    razorpayOrderId: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    razorpaySignature: {
      type: String,
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
    status: {
      type: String,
      required: true,
      enum: ['captured', 'failed', 'refunded'],
      default: 'captured'
    },
    method: {
      type: String
    },
    email: {
      type: String
    },
    contact: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
