import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import MoneyTransfer from './MoneyTransfer'
import TransactionHistory from './TransactionHistory'

const WalletDashboard = () => {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('history')

  const { isAuthenticated, user } = useAuth()

  // Function to handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Refresh balance when switching tabs
    fetchBalance()
  }

  // Fetch user balance
  const fetchBalance = async () => {
    try {
      const response = await api.get('/transactions/balance')
      setBalance(response.data.data.balance)
      setLoading(false)
    } catch (err) {
      setError('Failed to load balance')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="wallet-dashboard">
        <div className="login-prompt">
          <h2>Wallet Dashboard</h2>
          <p>Please log in to access your wallet.</p>
          <Link to="/login" className="btn-primary">Login</Link>
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading wallet...</div>
  }

  return (
    <div className="wallet-dashboard">
      <h2 className='text-4xl font-bold text-foreground mb-4'>Wallet Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="wallet-header">
        <div className="balance-card bg-background ">
          <div className="balance-title text-foreground">Available Balance</div>
          <div className="balance-amount text-foreground">₹{balance.toFixed(2)}</div>
          <div className="balance-user">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>

        <div className="wallet-actions">
          <Link to="/payment" className="btn-action deposit">
            <span className="action-icon">+</span>
            <span className="action-text">Add Money</span>
          </Link>
          <button
            className="btn-action transfer"
            onClick={() => handleTabChange('transfer')}
          >
            <span className="action-icon">→</span>
            <span className="action-text">Transfer</span>
          </button>
          <Link to="/upi" className="btn-action upi">
            <span className="action-icon">₹</span>
            <span className="action-text">UPI</span>
          </Link>
        </div>
      </div>

      <div className="wallet-tabs">
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => handleTabChange('history')}
        >
          Transaction History
        </button>
        <button
          className={activeTab === 'transfer' ? 'active' : ''}
          onClick={() => handleTabChange('transfer')}
        >
          Transfer Money
        </button>
      </div>

      <div className="wallet-content">
        {activeTab === 'history' ? (
          <TransactionHistory key="history" />
        ) : (
          <MoneyTransfer key="transfer" onTransferSuccess={fetchBalance} />
        )}
      </div>
    </div>
  )
}

export default WalletDashboard
