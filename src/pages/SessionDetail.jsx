import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { awardTickets, hasEarnedTicket } from '../lib/tickets'
import Layout from '../components/Layout'
import { Clock, MapPin, Download, CheckCircle, User } from 'lucide-react'

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { attendee } = useAuth()
  const [session, setSession]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    loadSession()
  }, [id, attendee?.id])

  async function loadSession() {
    const { data } = await supabase
      .from('sessions')
      .select('*, topics(name, icon)')
      .eq('id', id)
      .single()
    setSession(data)

    if (attendee?.id && data) {
      const { data: att } = await supabase
        .from('session_attendance')
        .select('id')
        .eq('attendee_id', attendee.id)
        .eq('session_id', id)
        .single()
      setCheckedIn(!!att)
    }
    setLoading(false)
  }

  async function handleCheckIn() {
    if (!attendee?.id || checkedIn) return
    setCheckingIn(true)

    const { error } = await supabase.from('session_attendance').insert({
      attendee_id: attendee.id,
      session_id: id,
    })

    if (!error) {
      setCheckedIn(true)
      // Award ticket (once per session)
      const already = await hasEarnedTicket(attendee.id, 'session_checkin')
      await awardTickets(attendee.id, 'SESSION_CHECKIN')
    }
    setCheckingIn(false)
  }

  if (loading) return (
    <Layout title="Session" back={() => navigate('/agenda')}>
      <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
    </Layout>
  )

  if (!session) return (
    <Layout title="Session" back={() => navigate('/agenda')}>
      <div className="text-center py-16 text-gray-500">Session not found.</div>
    </Layout>
  )

  const start = session.start_time ? new Date(session.start_time) : null
  const end   = session.end_time   ? new Date(session.end_time) : null

  return (
    <Layout title="Session detail" back={() => navigate('/agenda')}>
      <div className="p-4 space-y-4">
        {/* Header card */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
          {session.topics?.name && (
            <span className="text-xs bg-white/20 text-white/90 px-2 py-0.5 rounded-full mb-2 inline-block">
              {session.topics.icon} {session.topics.name}
            </span>
          )}
          <h1 className="text-xl font-bold leading-snug">{session.title}</h1>
          {start && (
            <div className="flex items-center gap-1 text-brand-200 text-sm mt-2">
              <Clock size={14} />
              {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              {end && ` – ${end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
              {session.room && <> <MapPin size={13} className="ml-1" /> {session.room}</>}
            </div>
          )}
        </div>

        {/* Check-in */}
        <button
          onClick={handleCheckIn}
          disabled={checkedIn || checkingIn}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition-colors ${
            checkedIn
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {checkedIn
            ? <><CheckCircle size={18} /> Checked in — +1 raffle ticket!</>
            : checkingIn ? 'Checking in…'
            : '✓ Check in to this session (+1 ticket)'}
        </button>

        {/* Description */}
        {session.description && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h2 className="font-semibold text-gray-900 mb-2">About this session</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{session.description}</p>
          </div>
        )}

        {/* Speaker */}
        {session.speaker_name && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Speaker</h2>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                {session.speaker_photo_url
                  ? <img src={session.speaker_photo_url} alt={session.speaker_name} className="w-12 h-12 rounded-full object-cover" />
                  : <User size={24} className="text-brand-600" />
                }
              </div>
              <div>
                <p className="font-semibold text-gray-900">{session.speaker_name}</p>
                {session.speaker_bio && <p className="text-sm text-gray-500 mt-1">{session.speaker_bio}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Download content */}
        {session.content_url && (
          <a
            href={session.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 hover:bg-green-100 transition-colors"
          >
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Download size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Download session content</p>
              <p className="text-xs text-gray-500">{session.content_filename || 'Slides & materials'}</p>
            </div>
          </a>
        )}
      </div>
    </Layout>
  )
}
