import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import '../../styles/SessionManager.css'

const SessionManager = () => {
  const { isAuthenticated, logout } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const logoutRef = useRef(logout)

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  // Warning will show when 2 minutes are left
  const WARNING_THRESHOLD = 2 * 60 * 1000

  // Use refs to store timers to prevent them from causing re-renders
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return

    // Clear any existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const checkSessionExpiry = () => {
      // Skip if not authenticated
      if (!isAuthenticated) return;

      const sessionExpiry = localStorage.getItem('sessionExpiry')

      if (!sessionExpiry) {
        setShowWarning(false);
        return;
      }

      try {
        const expiryTime = parseInt(sessionExpiry, 10)
        if (isNaN(expiryTime)) {
          console.error('Invalid session expiry time');
          return;
        }

        const currentTime = Date.now()
        const timeRemaining = expiryTime - currentTime

        // If less than WARNING_THRESHOLD milliseconds left, show warning
        if (timeRemaining > 0 && timeRemaining <= WARNING_THRESHOLD) {
          setShowWarning(true)
          setTimeLeft(Math.floor(timeRemaining / 1000))

          // Start countdown
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = setInterval(() => {
            const sessionExpiry = localStorage.getItem('sessionExpiry');
            if (!sessionExpiry) {
              clearInterval(countdownIntervalRef.current);
              return;
            }

            const newTimeLeft = Math.floor((parseInt(sessionExpiry, 10) - Date.now()) / 1000);

            if (newTimeLeft <= 0) {
              clearInterval(countdownIntervalRef.current);
              logout();
            } else {
              setTimeLeft(newTimeLeft);
            }
          }, 1000)
        } else {
          setShowWarning(false)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        }

        // Set timer to check again when warning should appear
        if (timeRemaining > WARNING_THRESHOLD) {
          if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
          warningTimerRef.current = setTimeout(checkSessionExpiry, timeRemaining - WARNING_THRESHOLD)
        }
      } catch (error) {
        console.error('Error checking session expiry:', error);
        setShowWarning(false);
      }
    }

    // Initial check
    checkSessionExpiry()

    // Check every minute
    const intervalId = setInterval(checkSessionExpiry, 60000)

    return () => {
      clearInterval(intervalId)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [isAuthenticated])

  const handleStayLoggedIn = () => {
    window.dispatchEvent(new Event('mousemove'));
    setShowWarning(false);
  }

  const handleLogout = () => {
    logout()
  }

  if (!showWarning) return null

  return (
    <div className="session-warning">
      <div className="session-warning-content">
        <h3>Session Timeout Warning</h3>
        <p>Your session will expire in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} minutes.</p>
        <div className="session-warning-actions">
          <button className="btn-primary" onClick={handleStayLoggedIn}>
            Stay Logged In
          </button>
          <button className="btn-secondary" onClick={handleLogout}>
            Logout Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionManager
