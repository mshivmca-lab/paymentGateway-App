import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least 1']
    },
    currency: {
      type: String,
      required: true,
      default: 'INR'
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    type: {
      type: String,
      required: true,
      enum: ['payment', 'transfer', 'refund', 'deposit', 'withdrawal'],
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot be more than 200 characters']
    },
    paymentId: {
      type: String,
      // This will be populated for transactions linked to Razorpay payments
    },
    metadata: {
      // Additional data related to the transaction
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
)

// Create a compound index for faster querying of user transactions
transactionSchema.index({ sender: 1, createdAt: -1 })
transactionSchema.index({ receiver: 1, createdAt: -1 })

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction
