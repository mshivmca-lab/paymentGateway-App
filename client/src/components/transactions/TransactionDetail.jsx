import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'

const TransactionDetail = () => {
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const { id } = useParams()
  
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await api.get(`/transactions/${id}`)
        setTransaction(response.data.data)
        setLoading(false)
      } catch (err) {
        setError('Failed to load transaction details')
        setLoading(false)
      }
    }
    
    fetchTransaction()
  }, [id])
  
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Format amount
  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`
  }
  
  // Get transaction type badge class
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'payment':
        return 'badge-primary'
      case 'transfer':
        return 'badge-info'
      case 'refund':
        return 'badge-warning'
      case 'deposit':
        return 'badge-success'
      case 'withdrawal':
        return 'badge-danger'
      default:
        return 'badge-secondary'
    }
  }
  
  // Get transaction status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success'
      case 'pending':
        return 'badge-warning'
      case 'failed':
        return 'badge-danger'
      default:
        return 'badge-secondary'
    }
  }
  
  if (loading) {
    return <div className="loading">Loading transaction details...</div>
  }
  
  if (error) {
    return (
      <div className="transaction-detail">
        <div className="alert alert-danger">{error}</div>
        <Link to="/transactions" className="btn-primary">Back to Transactions</Link>
      </div>
    )
  }
  
  if (!transaction) {
    return (
      <div className="transaction-detail">
        <div className="alert alert-warning">Transaction not found</div>
        <Link to="/transactions" className="btn-primary">Back to Transactions</Link>
      </div>
    )
  }
  
  return (
    <div className="transaction-detail">
      <h2>Transaction Details</h2>
      
      <div className="transaction-card">
        <div className="transaction-header">
          <h3>Transaction #{transaction.transactionId}</h3>
          <span className={`badge ${getStatusBadgeClass(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>
        
        <div className="transaction-info">
          <div className="info-row">
            <div className="info-label">Type</div>
            <div className="info-value">
              <span className={`badge ${getTypeBadgeClass(transaction.type)}`}>
                {transaction.type}
              </span>
            </div>
          </div>
          
          <div className="info-row">
            <div className="info-label">Amount</div>
            <div className="info-value amount">{formatAmount(transaction.amount)}</div>
          </div>
          
          <div className="info-row">
            <div className="info-label">Date</div>
            <div className="info-value">{formatDate(transaction.createdAt)}</div>
          </div>
          
          <div className="info-row">
            <div className="info-label">From</div>
            <div className="info-value">{transaction.sender?.name || 'N/A'} ({transaction.sender?.email || 'N/A'})</div>
          </div>
          
          <div className="info-row">
            <div className="info-label">To</div>
            <div className="info-value">{transaction.receiver?.name || 'N/A'} ({transaction.receiver?.email || 'N/A'})</div>
          </div>
          
          {transaction.description && (
            <div className="info-row">
              <div className="info-label">Description</div>
              <div className="info-value">{transaction.description}</div>
            </div>
          )}
          
          {transaction.paymentId && (
            <div className="info-row">
              <div className="info-label">Payment ID</div>
              <div className="info-value">{transaction.paymentId}</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="transaction-actions">
        <Link to="/transactions" className="btn-primary">Back to Transactions</Link>
      </div>
    </div>
  )
}

export default TransactionDetail
