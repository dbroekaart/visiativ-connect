import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { UserPlus, Check, X, Star, Calendar, Users } from 'lucide-react'

const withTimeout = (p, ms = 6000) => Promise.race([
  p,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
])

export default function Networking() {
  const { attendee, loading: authLoading } = useAuth()
  const [tab, setTab] = useState('suggestions')
  const [suggestions, setSuggestions]       = useState([])
  const [pendingIncoming, setPendingIncoming] = useState([])
  const [connections, setConnections]       = useState([])
  const [meetings, setMeetings]             = useState([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    if (attendee?.id) {
      loadAll()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [attendee?.id, authLoading])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([loadSuggestions(), loadConnections(), loadMeetings()])
    } catch (err) {
      console.error('loadAll error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadSuggestions() {
    if (!attendee?.id) return

    // Get my interests
    const { data: myInterests } = await withTimeout(supabase
      .from('attendee_interests')
      .select('topic_id')
      .eq('attendee_id', attendee.id))
    const myTopics = myInterests?.map(i => i.topic_id) || []

    if (myTopics.length === 0) { setSuggestions([]); return }

    // Get attendees with overlapping interests (not already connected)
    const { data: matches } = await withTimeout(supabase
      .from('attendee_interests')
      .select('attendee_id, topic_id, attendees(id, name, company, job_title, photo_url)')
      .in('topic_id', myTopics)
      .neq('attendee_id', attendee.id)
      .eq('attendees.profile_complete', true))

    // Check existing connections
    const { data: existingConns } = await withTimeout(supabase
      .from('connections')
      .select('requester_id, target_id')
      .or(`requester_id.eq.${attendee.id},target_id.eq.${attendee.id}`))

    const connectedIds = new Set(
      existingConns?.flatMap(c => [c.requester_id, c.target_id]).filter(id => id !== attendee.id) || []
    )

    // Aggregate match scores
    const scoreMap = {}
    matches?.forEach(m => {
      if (!m.attendees || connectedIds.has(m.attendee_id)) return
      if (!scoreMap[m.attendee_id]) {
        scoreMap[m.attendee_id] = { person: m.attendees, score: 0, topics: [] }
      }
      scoreMap[m.attendee_id].score++
      scoreMap[m.attendee_id].topics.push(m.topic_id)
    })

    const sorted = Object.values(scoreMap).sort((a, b) => b.score - a.score).slice(0, 10)
    setSuggestions(sorted)
  }

  async function loadConnections() {
    if (!attendee?.id) return

    // Incoming pending
    const { data: incoming } = await withTimeout(supabase
      .from('connections')
      .select('*, requester:requester_id(id, name, company, job_title, photo_url)')
      .eq('target_id', attendee.id)
      .eq('status', 'pending'))
    setPendingIncoming(incoming || [])

    // Accepted connections
    const { data: accepted } = await withTimeout(supabase
      .from('connections')
      .select('*, requester:requester_id(id, name, company, job_title, photo_url), target:target_id(id, name, company, job_title, photo_url)')
      .or(`requester_id.eq.${attendee.id},target_id.eq.${attendee.id}`)
      .eq('status', 'accepted'))
    setConnections(accepted || [])
  }

  async function loadMeetings() {
    if (!attendee?.id) return
    const { data } = await withTimeout(supabase
      .from('meeting_requests')
      .select('*, requester:requester_id(id, name, company, photo_url), target:target_id(id, name, company, photo_url)')
      .or(`requester_id.eq.${attendee.id},target_id.eq.${attendee.id}`)
      .order('created_at', { ascending: false }))
    setMeetings(data || [])
  }

  async function respondConnection(connId, status) {
    await supabase.from('connections').update({ status, updated_at: new Date().toISOString() }).eq('id', connId)
    await loadConnections()
  }

  async function respondMeeting(meetId, status) {
    await supabase.from('meeting_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', meetId)
    await loadMeetings()
  }

  const tabs = [
    { key: 'suggestions', label: 'Suggestions', count: suggestions.length },
    { key: 'requests',    label: 'Requests',    count: pendingIncoming.length },
    { key: 'connections', label: 'Connected',   count: connections.length },
    { key: 'meetings',    label: 'Meetings',    count: meetings.length },
  ]

  return (
    <Layout title="Networking">
      {/* Tabs */}
      <div className="flex gap-1 p-3 bg-white border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t.label}{t.count > 0 ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
        ) : (
          <>
            {/* SUGGESTIONS */}
            {tab === 'suggestions' && (
              suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <Star size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Set your interests first to get match suggestions.</p>
                  <Link to="/interests" className="mt-3 inline-block text-brand-600 text-sm font-medium">Set my interests →</Link>
                </div>
              ) : (
                suggestions.map(({ person, score }) => (
                  <Link key={person.id} to={`/attendees/${person.id}`}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3 hover:border-brand-300 transition-colors">
                    <Avatar name={person.name} photoUrl={person.photo_url} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{person.name}</p>
                      <p className="text-sm text-gray-500 truncate">{person.job_title} · {person.company}</p>
                    </div>
                    <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full flex-shrink-0">
                      {score} shared {score === 1 ? 'interest' : 'interests'}
                    </span>
                  </Link>
                ))
              )
            )}

            {/* REQUESTS */}
            {tab === 'requests' && (
              pendingIncoming.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No pending connection requests.</p>
                </div>
              ) : (
                pendingIncoming.map(conn => (
                  <div key={conn.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar name={conn.requester.name} photoUrl={conn.requester.photo_url} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{conn.requester.name}</p>
                        <p className="text-sm text-gray-500 truncate">{conn.requester.company}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => respondConnection(conn.id, 'accepted')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 text-white text-sm font-semibold py-2 rounded-xl">
                        <Check size={15} /> Accept
                      </button>
                      <button onClick={() => respondConnection(conn.id, 'declined')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-xl">
                        <X size={15} /> Decline
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* CONNECTIONS */}
            {tab === 'connections' && (
              connections.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No connections yet.</p>
                  <Link to="/attendees" className="mt-3 inline-block text-brand-600 text-sm font-medium">Browse attendees →</Link>
                </div>
              ) : (
                connections.map(conn => {
                  const other = conn.requester_id === attendee.id ? conn.target : conn.requester
                  return (
                    <Link key={conn.id} to={`/attendees/${other.id}`}
                      className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3">
                      <Avatar name={other.name} photoUrl={other.photo_url} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{other.name}</p>
                        <p className="text-sm text-gray-500 truncate">{other.company}</p>
                      </div>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">Connected</span>
                    </Link>
                  )
                })
              )
            )}

            {/* MEETINGS */}
            {tab === 'meetings' && (
              meetings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No meeting requests yet.</p>
                </div>
              ) : (
                meetings.map(m => {
                  const isRequester = m.requester_id === attendee.id
                  const other = isRequester ? m.target : m.requester
                  const statusColors = { pending: 'bg-yellow-50 text-yellow-700', accepted: 'bg-green-50 text-green-700', declined: 'bg-red-50 text-red-700' }
                  return (
                    <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar name={other.name} photoUrl={other.photo_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{other.name}</p>
                          <p className="text-xs text-gray-400">{other.company}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[m.status]}`}>{m.status}</span>
                      </div>
                      {m.proposed_time && <p className="text-sm text-gray-600"><strong>Time:</strong> {m.proposed_time}</p>}
                      {m.message && <p className="text-sm text-gray-500 mt-1">"{m.message}"</p>}
                      {!isRequester && m.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => respondMeeting(m.id, 'accepted')}
                            className="flex-1 bg-brand-600 text-white text-sm font-semibold py-2 rounded-xl">Accept</button>
                          <button onClick={() => respondMeeting(m.id, 'declined')}
                            className="flex-1 bg-gray-100 text-gray-600 text-sm py-2 rounded-xl">Decline</button>
                        </div>
                      )}
                    </div>
                  )
                })
              )
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
