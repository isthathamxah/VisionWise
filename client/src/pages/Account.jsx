import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import StatCard from '../components/StatCard/StatCard'
import api from '../services/api'

export default function Account() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/history/analytics').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="container-vw py-8 md:py-10 max-w-lg">
      <div className="mb-8">
        <span className="eyebrow">Account</span>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mt-2">Your profile</h1>
      </div>

      {/* Profile card */}
      <div className="card p-6 flex items-center gap-4 mb-6">
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brandSoft text-brand font-display font-bold text-xl shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-display font-bold text-lg text-text truncate">{user?.name || 'Account'}</p>
          <p className="text-sm text-muted truncate">{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <StatCard icon={Target} label="Avg score" value={`${stats.weeklyScore}`} sub="Past 7 days" />
          <StatCard icon={TrendingUp} label="Total scans" value={stats.totalScans} sub="This week" />
        </div>
      )}

      {/* Settings */}
      <div className="card p-2 mb-6">
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface2 transition-colors cursor-pointer text-text">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-sm font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl2 border border-border hover:bg-bad/10 hover:border-bad/25 transition-colors cursor-pointer text-bad font-medium">
        <LogOut size={18} /> Sign out
      </button>
    </div>
  )
}
