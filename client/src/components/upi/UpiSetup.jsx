import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/button'
import { Label } from "../ui/label"
import { Input } from "../ui/input"

const UpiSetup = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    customUpiId: '',
    pin: '',
    confirmPin: ''
  })
  const [upiDetails, setUpiDetails] = useState({
    upiId: '',
    hasSetupUpi: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Fetch UPI details on component mount
  useEffect(() => {
    const fetchUpiDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/upi/details')
        setUpiDetails(response.data.data)
        setLoading(false)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch UPI details')
        setLoading(false)
      }
    }

    fetchUpiDetails()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate PIN
    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match')
      return
    }

    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be a 4-digit number')
      return
    }

    // Validate UPI ID if provided
    if (formData.customUpiId) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$/
      if (!upiRegex.test(formData.customUpiId)) {
        setError('Invalid UPI ID format')
        return
      }
    }

    try {
      setLoading(true)

      const response = await axios.post('/api/upi/setup', {
        customUpiId: formData.customUpiId || undefined,
        pin: formData.pin
      })

      setUpiDetails(response.data.data)
      setSuccess('UPI setup successful!')
      setFormData({
        customUpiId: '',
        pin: '',
        confirmPin: ''
      })
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || 'UPI setup failed')
      setLoading(false)
    }
  }

  if (loading && !upiDetails.upiId) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="upi-setup">
      <h2 className='mb-4 text-foreground font-semibold text-xl'>UPI Setup</h2>

      {upiDetails.hasSetupUpi ? (
        <div className="upi-details">
          <div className="success-message">
            <p>Your UPI ID is set up and ready to use!</p>
          </div>
          <div className="upi-id-display">
            <h3>Your UPI ID</h3>
            <p className="upi-id">{upiDetails.upiId}</p>
          </div>
          <p className="upi-info">
            You can use this UPI ID for making and receiving payments.
          </p>
        </div>
      ) : (
        <>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="upi-form">
            <div className="form-group">
              <Label htmlFor="customUpiId">Custom UPI ID (Optional)</Label>
              <div className="upi-id-input">
                <Input
                  type="text"
                  id="customUpiId"
                  name="customUpiId"
                  value={formData.customUpiId}
                  onChange={handleChange}
                  placeholder="Enter custom UPI ID prefix"
                />
                <span className="upi-suffix text-foreground bg-background">@paygateway</span>
              </div>
              <small className="form-text">
                Leave blank to generate a UPI ID automatically based on your email.
              </small>
            </div>

            <div className="form-group">
              <Label htmlFor="pin">UPI PIN (4 digits)</Label>
              <Input
                type="password"
                id="pin"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="Enter 4-digit PIN"
                maxLength="4"
                pattern="[0-9]{4}"
                required
              />
            </div>

            <div className="form-group">
              <Label htmlFor="confirmPin">Confirm UPI PIN</Label>
              <Input
                type="password"
                id="confirmPin"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleChange}
                placeholder="Confirm 4-digit PIN"
                maxLength="4"
                pattern="[0-9]{4}"
                required
              />
            </div>

            <Button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Setup UPI'}
            </Button>
          </form>
        </>
      )}
    </div>
  )
}

export default UpiSetup
