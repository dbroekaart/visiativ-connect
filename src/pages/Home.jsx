import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getTicketCount } from '../lib/tickets'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { Calendar, Users, Ticket, Star, MessageCircle, ChevronRight, Zap, Heart, MapPin, Share2 } from 'lucide-react'

export default function Home() {
  const { attendee } = useAuth()
  const [event, setEvent]      = useState(null)
  const [tickets, setTickets]  = useState(0)
  const [nextSession, setNext] = useState(null)
  const [unread, setUnread]    = useState(0)

  useEffect(() => { loadData() }, [attendee?.id])

  async function loadData() {
    if (!attendee?.id) return

    const { data: ev } = await supabase.from('events').select('*').eq('is_active', true).single()
    setEvent(ev)

    const t = await getTicketCount(attendee.id)
    setTickets(t)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('event_id', ev?.id)
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
    setNext(sessions?.[0] || null)

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', attendee.id)
      .eq('is_read', false)
    setUnread(count || 0)
  }

  const am = attendee?.account_managers

  return (
    <Layout>
      <div className="p-4 space-y-3">

        {/* Welcome hero */}
        <div
          className="rounded-3xl p-5 text-white overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -right-2 w-36 h-36 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-indigo-200 text-xs font-medium mb-1">
              {event
                ? new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Welcome'}
            </p>
            <h2 className="text-2xl font-bold tracking-tight mb-0.5">
              Hi {attendee?.name?.split(' ')[0] || 'there'} 👋
            </h2>
            <p className="text-indigo-200 text-sm">{event?.name || 'Visiativ Customer Event'}</p>
            {event?.location && (
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin size={12} className="text-indigo-300" />
                <p className="text-indigo-300 text-xs">{event.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket counter */}
        <Link
          to="/prizes"
          className="flex items-center gap-3.5 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-lg transition-all"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Ticket size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{tickets} raffle {tickets === 1 ? 'ticket' : 'tickets'}</p>
            <p className="text-xs text-gray-400 truncate">Connect, check in & complete your profile to earn more</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
        </Link>

        {/* Account manager card */}
        {am && (
          <div className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-3">Your Visiativ contact</p>
            <div className="flex items-center gap-3">
              <Avatar name={am.name} photoUrl={am.photo_url} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{am.name}</p>
                <p className="text-xs text-gray-400 truncate">{am.email}</p>
                {am.bio && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{am.bio}</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Link
                to={`/chat/${am.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold py-2.5 rounded-xl"
              >
                <MessageCircle size={14} /> Message
              </Link>
              {am.linkedin_url && (
                <a
                  href={am.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 text-xs font-semibold py-2.5 rounded-xl"
                >
                  <Zap size={14} /> LinkedIn
                </a>
              )}
            </div>
          </div>
        )}

        {/* Up next session */}
        {nextSession && (
          <Link to={`/agenda/${nextSession.id}`} className="block bg-white rounded-2xl shadow-card p-4 hover:shadow-card-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Up next</p>
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-snug">{nextSession.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(nextSession.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              {nextSession.room && ` · ${nextSession.room}`}
            </p>
          </Link>
        )}

        {/* Quick actions grid */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">Quick Access</p>
          <div className="grid grid-cols-3 gap-2.5">
            <QuickAction to="/agenda"     icon={Calendar}      label="Agenda"    color="blue"   />
            <QuickAction to="/attendees"  icon={Users}         label="People"    color="purple" />
            <QuickAction to="/interests"  icon={Heart}         label="Interests" color="pink"   />
            <QuickAction to="/networking" icon={Star}          label="Network"   color="orange" badge={unread > 0 ? unread : null} />
            <QuickAction to="/venue"      icon={MapPin}        label="Venue"     color="teal"   />
            <QuickAction to="/social"     icon={Share2}        label="Social"    color="slate"  />
          </div>
        </div>

        {/* Survey CTA */}
        <Link
          to="/survey"
          className="flex items-center gap-3.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-sm"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Rate the event</p>
            <p className="text-xs text-green-100">+3 tickets for completing the survey</p>
          </div>
          <ChevronRight size={16} className="text-white/60" />
        </Link>

      </div>
    </Layout>
  )
}

function QuickAction({ to, icon: Icon, label, color, badge }) {
  const styles = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500'   },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500' },
    pink:   { bg: 'bg-pink-50',   icon: 'text-pink-500'   },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500' },
    teal:   { bg: 'bg-teal-50',   icon: 'text-teal-500'   },
    slate:  { bg: 'bg-slate-100', icon: 'text-slate-500'  },
  }
  const s = styles[color] || styles.blue
  return (
    <Link
      to={to}
      className="bg-white rounded-2xl p-3 flex flex-col items-center gap-2 shadow-card hover:shadow-card-lg transition-all relative text-center"
    >
      {badge && (
        <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
        <Icon size={18} className={s.icon} />
      </div>
      <span className="text-[11px] font-semibold text-gray-700 leading-tight">{label}</span>
    </Link>
  )
}
