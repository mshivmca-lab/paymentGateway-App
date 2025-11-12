import Razorpay from 'razorpay'
import dotenv from 'dotenv'

dotenv.config()

// Validate Razorpay credentials
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in environment variables');
  process.exit(1);
}

// console.log('Initializing Razorpay with key ID:', process.env.RAZORPAY_KEY_ID);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Test the Razorpay connection
razorpay.payments.all()
  .then(() => console.log('Razorpay connection successful'))
  .catch(err => console.error('Razorpay connection test failed:', err));

export default razorpay;
