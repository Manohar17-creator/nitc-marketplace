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
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-md"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        paddingTop: '6px'
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-1 px-3 min-w-[70px] transition-all ${
                isActive ? 'text-blue-600' : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] mt-1 ${
                  isActive ? 'font-semibold' : 'font-normal'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
