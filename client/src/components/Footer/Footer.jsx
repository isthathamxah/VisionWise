import { Link } from 'react-router-dom'
import { Scan } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container-vw py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-brand text-white">
            <Scan size={13} strokeWidth={2.4} />
          </span>
          <span className="font-display font-bold text-sm text-text">VisionWise</span>
        </Link>
        <p className="font-mono text-xs text-faint text-center">
          © {new Date().getFullYear()} VisionWise — Final Year Project
        </p>
      </div>
    </footer>
  )
}
