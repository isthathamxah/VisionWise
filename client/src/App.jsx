import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import BottomNav from './components/BottomNav/BottomNav'
import { ToastProvider } from './context/ToastContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Scanner from './pages/Scanner'
import History from './pages/History'

function Spinner() {
  return <div className="w-7 h-7 border-2 border-border border-t-brand rounded-full animate-spin" />
}

function ScrollToHash() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-dvh"><Spinner /></div>
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function OAuthCallback() {
  const { login } = useAuth()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const refresh = params.get('refresh')
    if (!token) return
    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(user => { login(token, refresh, user); window.location.href = '/scanner' })
  }, [])
  return <div className="flex flex-col items-center justify-center min-h-dvh gap-3"><Spinner /><p className="eyebrow">Signing you in</p></div>
}

function Shell({ children, footer = true }) {
  const { isAuthenticated } = useAuth()
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <Navbar />
      <main className={`flex-1 pt-16 ${isAuthenticated ? 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>{children}</main>
      {footer && <Footer />}
      {isAuthenticated && <BottomNav />}
    </div>
  )
}

function AppRoutes() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        <Route path="/"         element={<Shell><Home /></Shell>} />
        <Route path="/login"    element={<Shell footer={false}><Login /></Shell>} />
        <Route path="/register" element={<Shell footer={false}><Register /></Shell>} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/scanner"  element={<Shell footer={false}><ProtectedRoute><Scanner /></ProtectedRoute></Shell>} />
        <Route path="/history"  element={<Shell><ProtectedRoute><History /></ProtectedRoute></Shell>} />
        <Route path="*" element={
          <Shell footer={false}>
            <div className="flex items-center justify-center min-h-[70vh] flex-col gap-4 px-6 text-center">
              <span className="eyebrow">Error 404</span>
              <p className="font-display text-5xl font-extrabold text-text">Page not found</p>
              <p className="text-muted">That page isn&apos;t in frame.</p>
              <a href="/" className="btn-brand mt-2">Back to home</a>
            </div>
          </Shell>
        } />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
