import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Users, MessageCircle, Calendar, Ticket, Star, UserCheck } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    attendees: 0, profilesComplete: 0, connections: 0,
    messages: 0, checkins: 0, tickets: 0, surveys: 0, followUpLeads: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const withTimeout = (p) => Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ])
    try {
      const [
        { count: attendees },
        { count: profilesComplete },
        { count: connections },
        { count: messages },
        { count: checkins },
        { count: tickets },
        { count: surveys },
        { count: followUpLeads },
      ] = await Promise.all([
        withTimeout(supabase.from('attendees').select('id', { count: 'exact', head: true }).eq('is_visiativ_staff', false)),
        withTimeout(supabase.from('attendees').select('id', { count: 'exact', head: true }).eq('profile_complete', true).eq('is_visiativ_staff', false)),
        withTimeout(supabase.from('connections').select('id', { count: 'exact', head: true }).eq('status', 'accepted')),
        withTimeout(supabase.from('messages').select('id', { count: 'exact', head: true })),
        withTimeout(supabase.from('session_attendance').select('id', { count: 'exact', head: true })),
        withTimeout(supabase.from('draw_tickets').select('id', { count: 'exact', head: true })),
        withTimeout(supabase.from('surveys').select('id', { count: 'exact', head: true })),
        withTimeout(supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('follow_up_interest', true)),
      ])
      setStats({ attendees, profilesComplete, connections, messages, checkins, tickets, surveys, followUpLeads })
    } catch (err) {
      console.error('loadStats error:', err)
    } finally {
      setLoading(false)
    }
  }

  const items = [
    { label: 'Registered attendees', value: stats.attendees,        icon: Users,         color: 'blue'   },
    { label: 'Profiles complete',    value: stats.profilesComplete, icon: UserCheck,     color: 'green'  },
    { label: 'Connections made',     value: stats.connections,      icon: Users,         color: 'purple' },
    { label: 'Messages sent',        value: stats.messages,         icon: MessageCircle, color: 'teal'   },
    { label: 'Session check-ins',    value: stats.checkins,         icon: Calendar,      color: 'orange' },
    { label: 'Raffle tickets earned',value: stats.tickets,          icon: Ticket,        color: 'yellow' },
    { label: 'Surveys submitted',    value: stats.surveys,          icon: Star,          color: 'pink'   },
    { label: 'Follow-up leads',      value: stats.followUpLeads,    icon: UserCheck,     color: 'red'    },
  ]

  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    teal:   'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    pink:   'bg-pink-50 text-pink-600',
    red:    'bg-red-50 text-red-600',
  }

  const profileRate = stats.attendees > 0 ? Math.round((stats.profilesComplete / stats.attendees) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Event Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time engagement statistics</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
      ) : (
        <>
          {/* App adoption */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">App adoption</h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-brand-600 h-3 rounded-full transition-all"
                  style={{ width: `${profileRate}%` }}
                />
              </div>
              <span className="text-sm font-bold text-brand-700 w-12 text-right">{profileRate}%</span>
            </div>
            <p className="text-xs text-gray-500">{stats.profilesComplete} of {stats.attendees} attendees have completed their profile</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colorMap[color]}`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link to="/admin/leads"     className="bg-red-600 text-white rounded-2xl p-4 text-center font-semibold text-sm hover:bg-red-700">
              Export {stats.followUpLeads} leads
            </Link>
            <Link to="/admin/analytics" className="bg-brand-600 text-white rounded-2xl p-4 text-center font-semibold text-sm hover:bg-brand-700">
              View analytics
            </Link>
            <Link to="/admin/upload"    className="bg-gray-800 text-white rounded-2xl p-4 text-center font-semibold text-sm hover:bg-gray-900">
              Upload attendees
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
