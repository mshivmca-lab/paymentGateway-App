import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
// import UpiOtpComponent from "./UpiOtpComponent";

const UpiPayment = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    receiverUpiId: '',
    amount: '',
    description: '',
    pin: ''
  })

  const [upiDetails, setUpiDetails] = useState({ upiId: '', hasSetupUpi: false })
  const [balance, setBalance] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [otpSent, setOtpSent] = useState(false)
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const upiResponse = await axios.get('/api/upi/details')
        setUpiDetails(upiResponse.data.data)

        const balanceResponse = await axios.get('/api/transactions/balance')
        setBalance(balanceResponse.data.data.balance)

        setLoading(false)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch data')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const amount = parseFloat(formData.amount)
    if (!formData.receiverUpiId || !formData.amount || !formData.pin) {
      return setError("All fields are required.")
    }

    if (isNaN(amount) || amount <= 0) {
      return setError("Amount must be a positive number")
    }

    if (amount > balance) {
      return setError("Insufficient balance")
    }

    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      return setError("PIN must be a 4-digit number")
    }

    try {
      await axios.post('/api/otp/send-otp', { email: user.email })
      setOtpSent(true)
      setShowOtpBox(true)
    } catch (err) {
      setError("Failed to send OTP")
    }
  }

  const handleVerifyOtp = async () => {
    try {
      await axios.post('/api/otp/verify-otp', {
        email: user.email,
        otp
      })

      setOtpVerified(true)
      handleFinalPayment()
    } catch (err) {
      setError("Invalid or expired OTP")
    }
  }

  const handleFinalPayment = async () => {
    try {
      setLoading(true)
      const response = await axios.post('/api/upi/pay', {
        ...formData
      })

      setSuccess('Payment successful!')
      navigate('/payment/success', {
        state: {
          paymentId: response.data.data.transactionId,
          amount: formData.amount,
          method: 'UPI',
          receiver: response.data.data.receiver.upiId
        }
      })

      setFormData({
        receiverUpiId: '',
        amount: '',
        description: '',
        pin: ''
      })
      setOtp('')
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !upiDetails.hasSetupUpi) {
    return <div className="loading">Loading...</div>
  }

  if (!upiDetails.hasSetupUpi) {
    return (
      <div className="upi-payment">
        <h2 className='text-3xl text-foreground font-bold'>UPI Payment</h2>
        <div className="setup-prompt">
          <p>You need to set up UPI before making payments.</p>
          <button
            onClick={() => navigate('/profile/upi-setup')}
            className="btn-primary"
          >
            Set Up UPI
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="upi-payment">
      <h2 className='text-2xl font-bold text-foreground'>UPI Payment</h2>

      <div className="balance-display">
        <h3 className='text-foreground'>Your Balance</h3>
        <p className="balance-amount text-foreground">₹{balance.toFixed(2)}</p>
        <p className="upi-id-display text-foreground">UPI ID: {upiDetails.upiId}</p>
      </div>

      <form onSubmit={handleSubmit} className="upi-payment-form">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-group">
          <Label htmlFor="receiverUpiId">Receiver's UPI ID</Label>
          <Input
            type="text"
            id="receiverUpiId"
            name="receiverUpiId"
            value={formData.receiverUpiId}
            onChange={handleChange}
            placeholder="Enter receiver's UPI ID"
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            min="1"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter a description for this payment"
            rows="2"
          />
        </div>

        <div className="form-group">
          <Label htmlFor="pin">UPI PIN</Label>
          <Input
            type="password"
            id="pin"
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            placeholder="Enter your 4-digit UPI PIN"
            maxLength="4"
            pattern="[0-9]{4}"
            required
          />
        </div>

        {!otpSent && (
          <Button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Send OTP & Continue'}
          </Button>
        )}
      </form>

      {showOtpBox && !otpVerified && (
        <div className="otp-box mt-4">
          <Label>Enter OTP sent to {user.email}</Label>
          <Input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            maxLength={6}
            className="border p-2 my-2"
          />
          <Button
            onClick={handleVerifyOtp}
            className="bg-green-600 text-white px-4 py-2"
          >
            Verify OTP & Pay
          </Button>
        </div>
      )}
    </div>
  )
}



export default UpiPayment;
