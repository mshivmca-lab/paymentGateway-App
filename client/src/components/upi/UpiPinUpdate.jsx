import { useState } from 'react'
import api from '../../utils/api'
import { Button } from '../ui/button'
import { Label } from "../ui/label"
import { Input } from "../ui/input"

const UpiPinUpdate = () => {
  const [formData, setFormData] = useState({
    currentPin: '',
    newPin: '',
    confirmNewPin: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

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

    // Validate PINs
    if (formData.newPin !== formData.confirmNewPin) {
      setError('New PINs do not match')
      return
    }

    if (formData.newPin.length !== 4 || !/^\d{4}$/.test(formData.newPin)) {
      setError('PIN must be a 4-digit number')
      return
    }

    try {
      setLoading(true)

      const response = await api.put('/upi/update-pin', {
        currentPin: formData.currentPin,
        newPin: formData.newPin
      })

      setSuccess('UPI PIN updated successfully!')
      setFormData({
        currentPin: '',
        newPin: '',
        confirmNewPin: ''
      })
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update UPI PIN')
      setLoading(false)
    }
  }

  return (
    <div className="upi-pin-update">
      <h2>Update UPI PIN</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="pin-update-form">
        <div className="form-group">
          <Label htmlFor="currentPin">Current PIN</Label>
          <Input
            type="password"
            id="currentPin"
            name="currentPin"
            value={formData.currentPin}
            onChange={handleChange}
            placeholder="Enter current PIN"
            maxLength="4"
            pattern="[0-9]{4}"
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="newPin">New PIN</Label>
          <Input
            type="password"
            id="newPin"
            name="newPin"
            value={formData.newPin}
            onChange={handleChange}
            placeholder="Enter new PIN"
            maxLength="4"
            pattern="[0-9]{4}"
            required
          />
        </div>

        <div className="form-group">
          <Label htmlFor="confirmNewPin">Confirm New PIN</Label>
          <Input
            type="password"
            id="confirmNewPin"
            name="confirmNewPin"
            value={formData.confirmNewPin}
            onChange={handleChange}
            placeholder="Confirm new PIN"
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
          {loading ? 'Processing...' : 'Update PIN'}
        </Button>
      </form>
    </div>
  )
}

export default UpiPinUpdate
