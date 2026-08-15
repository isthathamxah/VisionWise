import { NavLink } from 'react-router-dom'
import { LayoutGrid, ScanLine, User } from 'lucide-react'

// Primary mobile navigation. Desktop keeps using the top Navbar's own links;
// this only renders md:hidden, and only for signed-in users (there's nothing
// app-like to navigate to while logged out).
export default function BottomNav() {
  const tabCls = ({ isActive }) =>
    `flex flex-col items-center gap-1 px-6 py-2 cursor-pointer transition-colors ${isActive ? 'text-brand' : 'text-muted'}`

  return (
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

        <NavLink to="/account" className={tabCls}>
          <User size={20} />
          <span className="text-[10px] font-medium">Account</span>
        </NavLink>
      </div>
    </nav>
  )
}
