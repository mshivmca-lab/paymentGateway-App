import axios from 'axios'

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
  },
  withCredentials: true
})

let isRefreshing = false
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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
        const response = await axios.post(
          `${BASE_URL.replace(/\/+$/, '')}/auth/refresh-token`,
        {},
        { withCredentials: true}
        )
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
        // localStorage.removeItem('sessionExpiry')
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
