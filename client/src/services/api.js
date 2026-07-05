import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Turn any axios error into a readable, user-facing message.
export function getApiError(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response) {
    const d = err.response.data || {}
    if (Array.isArray(d.errors) && d.errors.length) return d.errors[0].msg || fallback
    return d.error || d.message || fallback
  }
  if (err?.request) return 'Can\'t reach the server. Make sure the backend is running, then try again.'
  return fallback
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('vw_refresh')
      if (!refresh) return Promise.reject(err)
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, { refreshToken: refresh })
        localStorage.setItem('vw_token', data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
