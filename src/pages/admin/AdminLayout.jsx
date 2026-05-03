import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Upload, Calendar, BarChart2, Download, Settings, Tag, ShieldCheck, ArrowLeft, Trash2 } from 'lucide-react'

const navItems = [
  { to: '/admin',           icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/upload',    icon: Upload,          label: 'Attendees'  },
  { to: '/admin/agenda',    icon: Calendar,        label: 'Agenda'     },
  { to: '/admin/analytics', icon: BarChart2,       label: 'Analytics'  },
  { to: '/admin/leads',     icon: Download,        label: 'Leads'      },
  { to: '/admin/topics',    icon: Tag,             label: 'Topics'     },
  { to: '/admin/admins',    icon: ShieldCheck,     label: 'Admins'     },
  { to: '/admin/event',     icon: Settings,        label: 'Event'      },
  { to: '/admin/reset',     icon: Trash2,          label: 'Reset',  danger: true },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-brand-700 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-brand-200 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg flex-1">Admin Dashboard</h1>
        <span className="text-xs bg-brand-900 px-2 py-1 rounded-full">Admin</span>
      </header>

      {/* Side nav (desktop) / horizontal nav (mobile) */}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-52px)]">
        <nav className="bg-white border-b md:border-b-0 md:border-r border-gray-200 md:w-48 flex md:flex-col overflow-x-auto md:overflow-visible">
          {navItems.map(({ to, icon: Icon, label, end, danger }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  danger
                    ? isActive
                      ? 'text-red-700 bg-red-50 md:border-r-2 md:border-red-500'
                      : 'text-red-500 hover:bg-red-50'
                    : isActive
                      ? 'text-brand-700 bg-brand-50 md:border-r-2 md:border-brand-600'
                      : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
