'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Users, User } from 'lucide-react'

export default function MobileNavbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/attendance', label: 'Attendance', icon: BookOpen },
    { href: '/communities', label: 'Communities', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto pb-safe">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-2.5 px-4 min-w-[64px] transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[11px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}