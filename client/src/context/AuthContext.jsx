import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('vw_token')
    const storedUser = localStorage.getItem('vw_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (accessToken, refreshToken, userData) => {
    localStorage.setItem('vw_token', accessToken)
    localStorage.setItem('vw_refresh', refreshToken)
    localStorage.setItem('vw_user', JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('vw_token')
    localStorage.removeItem('vw_refresh')
    localStorage.removeItem('vw_user')
    setToken(null)
    setUser(null)
  }

  // Merges a partial profile update (e.g. after PATCH /auth/profile) into the
  // stored user, without touching tokens.
  const updateUser = patch => {
    setUser(u => {
      const next = { ...u, ...patch }
      localStorage.setItem('vw_user', JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
