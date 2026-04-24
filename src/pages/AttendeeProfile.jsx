import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { awardTickets, hasEarnedTicket } from '../lib/tickets'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { MessageCircle, UserPlus, Check, Clock, Linkedin, Calendar } from 'lucide-react'

export default function AttendeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { attendee } = useAuth()
  const [profile, setProfile]       = useState(null)
  const [interests, setInterests]   = useState([])
  const [connection, setConnection] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => { loadProfile() }, [id, attendee?.id])

  async function loadProfile() {
    const { data: p } = await supabase
      .from('attendees')
      .select('*, account_managers(name)')
      .eq('id', id)
      .single()
    setProfile(p)

    const { data: ints } = await supabase
      .from('attendee_interests')
      .select('*, topics(name, icon)')
      .eq('attendee_id', id)
      .eq('is_public', true)
    setInterests(ints || [])

    if (attendee?.id) {
      const { data: conn } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${attendee.id},target_id.eq.${id}),and(requester_id.eq.${id},target_id.eq.${attendee.id})`)
        .single()
      setConnection(conn || null)
    }

    setLoading(false)
  }

  async function handleConnect() {
    if (!attendee?.id || connection) return
    setConnecting(true)
    const { error } = await supabase.from('connections').insert({
      requester_id: attendee.id,
      target_id: id,
      status: 'pending',
    })
    if (!error) {
      const isFirst = await hasEarnedTicket(attendee.id, 'first_connection')
      if (!isFirst) await awardTickets(attendee.id, 'FIRST_CONNECTION')
      await awardTickets(attendee.id, 'CONNECTION')
      await loadProfile()
    }
    setConnecting(false)
  }

  async function handleMeetingRequest() {
    const message = prompt("Optional: add a short message about why you'd like to meet")
    const time = prompt('Suggested meeting time (e.g. "After lunch, around 13:30")')
    if (time === null) return
    await supabase.from('meeting_requests').insert({
      requester_id: attendee.id,
      target_id: id,
      proposed_time: time,
      message,
    })
    await awardTickets(attendee.id, 'MEETING_REQUEST')
    alert('Meeting request sent!')
  }

  const connectionLabel = () => {
    if (!connection) return null
    if (connection.status === 'accepted') return { text: 'Connected', icon: Check, color: 'text-green-600 bg-green-50' }
    if (connection.requester_id === attendee?.id) return { text: 'Request sent', icon: Clock, color: 'text-gray-500 bg-gray-100' }
    return { text: 'Wants to connect', icon: UserPlus, color: 'text-brand-600 bg-brand-50' }
  }
  const connLabel = connectionLabel()

  if (loading) return (
    <Layout title="" back={() => navigate('/attendees')}>
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    </Layout>
  )

  if (!profile) return (
    <Layout title="" back={() => navigate('/attendees')}>
      <div className="text-center py-16 text-gray-400 text-sm">Profile not found.</div>
    </Layout>
  )

  return (
    <Layout title="" back={() => navigate('/attendees')}>
      <div className="p-4 space-y-3">

        {/* Profile card */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {/* Banner */}
          <div
            className="h-20"
            style={{
              background: profile.is_visiativ_staff
                ? 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)'
                : 'linear-gradient(135deg, #6366F1 0%, #A5B4FC 100%)',
            }}
          />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-8 mb-3">
              <div className="ring-4 ring-white rounded-2xl">
                <Avatar name={profile.name} photoUrl={profile.photo_url} size="xl" />
              </div>
              {connLabel && (
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${connLabel.color}`}>
                  <connLabel.icon size={12} /> {connLabel.text}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
              {profile.is_visiativ_staff && (
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold mt-0.5">Visiativ</span>
              )}
            </div>
            {profile.job_title && <p className="text-sm text-gray-500 mt-0.5">{profile.job_title}</p>}
            {profile.company && <p className="text-sm text-gray-400">{profile.company}</p>}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#0A66C2] mt-2 font-medium"
              >
                <Linkedin size={12} /> LinkedIn
              </a>
            )}
            {profile.bio && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {attendee?.id !== id && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {!connection && (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-brand-700 transition-colors shadow-lift"
                >
                  <UserPlus size={16} />
                  {connecting ? 'Connecting…' : 'Connect'}
                </button>
              )}
              {connection?.requester_id === id && connection?.status === 'pending' && (
                <button
                  onClick={async () => {
                    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connection.id)
                    await loadProfile()
                  }}
                  className="flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-3.5 rounded-2xl shadow-sm"
                >
                  <Check size={16} /> Accept
                </button>
              )}
              <Link
                to={`/chat/${id}`}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl shadow-card hover:shadow-card-lg transition-all"
              >
                <MessageCircle size={16} /> Message
              </Link>
            </div>
            <button
              onClick={handleMeetingRequest}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl shadow-card hover:shadow-card-lg transition-all"
            >
              <Calendar size={16} /> Request a meeting
            </button>
          </div>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Interested in</h2>
            <div className="flex flex-wrap gap-2">
              {interests.map(i => (
                <span
                  key={i.id}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    i.want_more_info
                      ? 'bg-brand-100 text-brand-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {i.topics?.icon} {i.topics?.name}
                  {i.want_more_info && ' 🙋'}
                </span>
              ))}
            </div>
            {interests.some(i => i.want_more_info) && (
              <p className="text-[11px] text-gray-400 mt-2.5">🙋 = wants more information</p>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}
