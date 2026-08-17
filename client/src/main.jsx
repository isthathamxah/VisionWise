import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Dev-only guard: a service worker cache-intercepts fetches, which fights
// directly with Vite's dev server (fresh unbundled modules per request,
// instant HMR) — confirmed live, it silently served a stale bundle on
// localhost long after the source had changed, with no error to explain it.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {})
  })
}
