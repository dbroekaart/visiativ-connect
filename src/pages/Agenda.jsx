import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Clock, MapPin, Download, ChevronRight, Calendar } from 'lucide-react'

export default function Agenda() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      const withTimeout = (p) => Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
      ])
      const { data: ev } = await withTimeout(supabase.from('events').select('id').eq('is_active', true).single())
      if (!ev) { setLoading(false); return }

      const { data } = await withTimeout(supabase
        .from('sessions')
        .select('*, topics(name, icon)')
        .eq('event_id', ev.id)
        .eq('is_published', true)
        .order('start_time', { ascending: true }))
      setSessions(data || [])
    } catch (err) {
      console.error('loadSessions error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Group sessions by date
  const grouped = sessions.reduce((acc, s) => {
    const date = s.start_time ? new Date(s.start_time).toDateString() : 'TBC'
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {})

  return (
    <Layout title="Agenda">
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 px-6">
          <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">The agenda hasn't been published yet.</p>
          <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {Object.entries(grouped).map(([date, daySessions]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {date === 'TBC' ? 'Time TBC' : new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <div className="space-y-3">
                {daySessions.map(session => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}

function SessionCard({ session }) {
  const start = session.start_time ? new Date(session.start_time) : null
  const end   = session.end_time   ? new Date(session.end_time)   : null

  return (
    <Link to={`/agenda/${session.id}`} className="block bg-white border border-gray-200 rounded-2xl p-4 hover:border-brand-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Time */}
          {start && (
            <div className="flex items-center gap-1 text-xs text-brand-600 font-medium mb-1">
              <Clock size={12} />
              {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              {end && ` – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          )}

          <h3 className="font-semibold text-gray-900 leading-snug">{session.title}</h3>

          {session.speaker_name && (
            <p className="text-sm text-gray-500 mt-0.5">{session.speaker_name}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {session.room && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} /> {session.room}
              </span>
            )}
            {session.topics?.name && (
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                {session.topics.icon} {session.topics.name}
              </span>
            )}
            {session.content_url && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Download size={11} /> Slides available
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </Link>
  )
}
