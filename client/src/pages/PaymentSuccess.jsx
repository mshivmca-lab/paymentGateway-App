import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const PaymentSuccess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  const [paymentInfo, setPaymentInfo] = useState({
    paymentId: null,
    amount: null,
    method: null,
    receiver: null,
    from: null,
  })

  useEffect(() => {
    if (location.state) {
      setPaymentInfo({
        paymentId: location.state.paymentId || null,
        amount: location.state.amount || null,
        method: location.state.method || null,
        receiver: location.state.receiver || null,
        from: location.state.from || null,
      })
    } else {
      // Redirect to home or error page if no payment info (optional)
      navigate('/')
    }
  }, [location.state, navigate])

  // ✅ Safe navigation logic in useEffect only
  useEffect(() => {
    if (paymentInfo.from === 'wallet' || !paymentInfo.method) {
      const timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            navigate('/wallet')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [navigate, paymentInfo])

  return (
    <div className="success-page">
      <div className="success-icon">✓</div>
      <h1>Payment Successful!</h1>

      {paymentInfo.paymentId && (
        <p>
          <strong>Payment ID:</strong> {paymentInfo.paymentId}
        </p>
      )}
      {paymentInfo.amount && (
        <p>
          <strong>Amount Paid:</strong> ₹{parseFloat(paymentInfo.amount).toFixed(2)}
        </p>
      )}
      {paymentInfo.method && (
        <p>
          <strong>Payment Method:</strong> {paymentInfo.method}
        </p>
      )}
      {paymentInfo.receiver && (
        <p>
          <strong>Recipient:</strong> {paymentInfo.receiver}
        </p>
      )}
      <p>Thank you for your payment. Your transaction has been completed successfully.</p>

      <div className="action-buttons">
        {(paymentInfo.from === 'wallet' || !paymentInfo.method) ? (
          <>
            <Link to="/wallet">
              <button className="btn-primary">Go to Wallet</button>
            </Link>
            <p className="redirect-message">
              Redirecting to wallet in {redirectCountdown} seconds...
            </p>
          </>
        ) : (
          <>
            <Link to="/">
              <button className="btn-primary">Back to Home</button>
            </Link>
            {paymentInfo.method === 'UPI' && (
              <Link to="/upi">
                <button className="btn-secondary">UPI Dashboard</button>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccess
