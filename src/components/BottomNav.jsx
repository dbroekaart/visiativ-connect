import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, Users, MessageCircle, User } from 'lucide-react'

const navItems = [
  { to: '/',          icon: Home,          label: 'Home'    },
  { to: '/agenda',    icon: Calendar,      label: 'Agenda'  },
  { to: '/attendees', icon: Users,         label: 'People'  },
  { to: '/chat',      icon: MessageCircle, label: 'Chat'    },
  { to: '/profile',   icon: User,          label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="glass border-t border-white/60 fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="flex justify-around items-end h-16 px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 relative group"
            >
              {active && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-7 bg-brand-100 rounded-xl -z-10" />
              )}
              <Icon
                size={22}
                className={`transition-all ${active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium tracking-wide transition-all ${active ? 'text-brand-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
