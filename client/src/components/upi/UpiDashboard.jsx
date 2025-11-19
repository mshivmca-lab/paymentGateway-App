import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import UpiSetup from './UpiSetup'
import UpiPinUpdate from './UpiPinUpdate'
import UpiPayment from './UpiPayment'
import { Button } from '../ui/button'

const UpiDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('payment')
  const [upiDetails, setUpiDetails] = useState({
    upiId: '',
    hasSetupUpi: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch UPI details on component mount
  useEffect(() => {
    const fetchUpiDetails = async () => {
      try {
        setLoading(true)
        const response = await api.get('/upi/details')
        setUpiDetails(response.data.data)
        
        // If UPI is not set up, show setup tab
        if (!response.data.data.hasSetupUpi) {
          setActiveTab('setup')
        }
        
        setLoading(false)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch UPI details')
        setLoading(false)
      }
    }

    fetchUpiDetails()
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="upi-dashboard">
      <h1 className='text-2xl font-bold text-foreground'>UPI Dashboard</h1>
      
      {upiDetails.hasSetupUpi && (
        <div className="upi-info-bar">
          <p>Your UPI ID: <strong>{upiDetails.upiId}</strong></p>
        </div>
      )}

      <div className="upi-tabs">
        {upiDetails.hasSetupUpi && (
          <>
            <button
              className={activeTab === 'payment' ? 'active' : ''}
              onClick={() => handleTabChange('payment')}
            >
              Make Payment
            </button>
            <button
              className={activeTab === 'update-pin' ? 'active' : ''}
              onClick={() => handleTabChange('update-pin')}
            >
              Update PIN
            </button>
          </>
        )}
        <Button
          className={activeTab === 'setup' ? 'active' : ''}
          onClick={() => handleTabChange('setup')}
        >
          {upiDetails.hasSetupUpi ? 'UPI Details' : 'Setup UPI'}
        </Button>
      </div>

      <div className="upi-content">
        {activeTab === 'payment' && upiDetails.hasSetupUpi && <UpiPayment />}
        {activeTab === 'update-pin' && upiDetails.hasSetupUpi && <UpiPinUpdate />}
        {activeTab === 'setup' && <UpiSetup />}
      </div>
    </div>
  )
}

export default UpiDashboard
