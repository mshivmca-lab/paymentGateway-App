import axios from 'axios'

// Use VITE_API_URL (injected at build time) or fallback to local proxy.
// Normalize to avoid "undefined/api" or duplicated "/api".
const _envBase = import.meta.env.VITE_API_URL || ''
const _cleanBase = _envBase.replace(/\/+$/,'') // remove trailing slashes
const BASE_URL = _cleanBase
  ? (_cleanBase.endsWith('/api') ? _cleanBase : `${_cleanBase}/api`)
  : '/api'

// Create an axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Flag to prevent multiple refresh token requests
let isRefreshing = false
// Store pending requests that should be retried after token refresh
let failedQueue = []

// Process the queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token')

    // If token exists, add it to the request header
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // If the error is due to an expired token (401) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest?._retry && localStorage.getItem('token')) {
      console.log('Received 401 error. Token might be expired. URL:', originalRequest.url)

      if (isRefreshing) {
        console.log('Token refresh already in progress. Adding request to queue.')
        // If we're already refreshing, add this request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            // Retry the original request with the new token using the api instance (so baseURL is applied)
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => {
            console.error('Failed to process queued request:', err)
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        console.log('Attempting to refresh token...')
        // Use full BASE_URL so the refresh request hits the API host (not the static site)
        const response = await axios.get(`${BASE_URL.replace(/\/+$/, '')}/auth/refresh-token`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          _retry: true
        })

        if (response.data?.success && response.data?.token) {
          console.log('Token refresh successful!')
          // Update token in localStorage
          localStorage.setItem('token', response.data.token)
          // Update user data if present
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user))
          }

          // Update api default headers so subsequent requests use the new token
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`

          // Process the queue with the new token
          processQueue(null, response.data.token)

          // Retry the original request with the new token
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`
          console.log('Retrying original request with new token...')
          return api(originalRequest)
        } else {
          console.error('Token refresh failed: Server returned unsuccessful response')
          // If refresh failed, clear auth data and redirect to login
          processQueue(new Error('Refresh failed'), null)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('sessionExpiry')
          window.location.href = '/login'

          return Promise.reject(error)
        }
      } catch (refreshError) {
        console.error('Token refresh request failed:', refreshError)
        // If refresh request fails, clear auth data and redirect to login
        processQueue(refreshError, null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('sessionExpiry')
        window.location.href = '/login'

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api
