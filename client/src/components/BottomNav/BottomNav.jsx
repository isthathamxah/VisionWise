import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, ScanLine, User, Sun, Moon, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import BottomSheet from '../BottomSheet/BottomSheet'

// Primary mobile navigation. Desktop keeps using the top Navbar's own links;
// this only renders md:hidden, and only for signed-in users (there's nothing
// app-like to navigate to while logged out).
export default function BottomNav() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)

  const handleLogout = () => {
    setAccountOpen(false)
    logout()
    navigate('/')
  }

  const tabCls = ({ isActive }) =>
    `flex flex-col items-center gap-1 px-6 py-2 cursor-pointer transition-colors ${isActive ? 'text-brand' : 'text-muted'}`

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16">
          <NavLink to="/history" className={tabCls}>
            <LayoutGrid size={20} />
            <span className="text-[10px] font-medium">Dashboard</span>
          </NavLink>

          <NavLink to="/scanner" aria-label="Scanner"
            className={({ isActive }) => `flex items-center justify-center w-14 h-14 -mt-7 rounded-full text-white shadow-brand transition-colors ${isActive ? 'bg-brandStrong' : 'bg-brand'}`}>
            <ScanLine size={24} />
          </NavLink>

          <button onClick={() => setAccountOpen(true)}
            className={`flex flex-col items-center gap-1 px-6 py-2 cursor-pointer transition-colors ${accountOpen ? 'text-brand' : 'text-muted'}`}>
            <User size={20} />
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>
      </nav>

      <BottomSheet open={accountOpen} onClose={() => setAccountOpen(false)}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-brandSoft text-brand font-display font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-text truncate">{user?.name || 'Account'}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface2 transition-colors cursor-pointer text-text">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-bad/10 transition-colors cursor-pointer text-bad mt-1">
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
