import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const { user } = useAuth()
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/merchant/dashboard')
        setDashboardData(res.data.data)
        setLoading(false)
      } catch (err) {
        setError('Failed to load dashboard data')
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])
  
  if (loading) {
    return <div>Loading dashboard...</div>
  }
  
  if (error) {
    return <div className="alert alert-danger">{error}</div>
  }
  
  return (
    <div className="merchant-dashboard">
      <h2 className='text-3xl font-bold text-foreground mb-2'>{user.role} dashboard</h2>
      <p className='text-foreground text-xl mb-4'>Welcome, {user.name}!</p>
      
      {dashboardData && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p className="stat-value text-foreground">₹{dashboardData.totalRevenue.toFixed(2)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Pending Amount</h3>
              <p className="stat-value text-foreground">₹{dashboardData.pendingAmount.toFixed(2)}</p>
            </div>
            
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p className="stat-value text-foreground">{dashboardData.totalOrders}</p>
            </div>
            
            <div className="stat-card">
              <h3>Total Payments</h3>
              <p className="stat-value text-foreground">{dashboardData.totalPayments}</p>
            </div>
          </div>
          
          <div className="dashboard-section">
            <h3>Payment Status</h3>
            <div className="status-cards">
              <div className="status-card">
                <h4>Captured</h4>
                <p>{dashboardData.paymentStatusCounts.captured}</p>
              </div>
              <div className="status-card">
                <h4>Failed</h4>
                <p>{dashboardData.paymentStatusCounts.failed}</p>
              </div>
              <div className="status-card">
                <h4>Refunded</h4>
                <p>{dashboardData.paymentStatusCounts.refunded}</p>
              </div>
            </div>
          </div>
          
          <div className="dashboard-section">
            <h3>Order Status</h3>
            <div className="status-cards">
              <div className="status-card">
                <h4>Created</h4>
                <p>{dashboardData.orderStatusCounts.created}</p>
              </div>
              <div className="status-card">
                <h4>Paid</h4>
                <p>{dashboardData.orderStatusCounts.paid}</p>
              </div>
              <div className="status-card">
                <h4>Failed</h4>
                <p>{dashboardData.orderStatusCounts.failed}</p>
              </div>
            </div>
          </div>
          
          <div className="dashboard-section">
            <h3>Recent Orders</h3>
            {dashboardData.recentOrders.length > 0 ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.razorpayOrderId}</td>
                      <td>₹{(order.amount / 100).toFixed(2)}</td>
                      <td>{order.status}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No recent orders</p>
            )}
          </div>
          
          <div className="dashboard-section">
            <h3>Recent Payments</h3>
            {dashboardData.recentPayments.length > 0 ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentPayments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.razorpayPaymentId}</td>
                      <td>₹{(payment.amount / 100).toFixed(2)}</td>
                      <td>{payment.status}</td>
                      <td>{payment.method || 'N/A'}</td>
                      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No recent payments</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
