import { Link } from 'react-router-dom'

const PaymentFailed = () => {
  return (
    <div className="failed-page">
      <div className="failed-icon">✗</div>
      <h1>Payment Failed</h1>
      <p>
        We're sorry, but your payment could not be processed at this time.
        Please try again or contact support if the issue persists.
      </p>
      <Link to="/">
        <button className="btn-primary">Try Again</button>
      </Link>
    </div>
  )
}

export default PaymentFailed
