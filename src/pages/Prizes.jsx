import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getTicketCount, TICKET_ACTIONS } from '../lib/tickets'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { Ticket, Trophy, Zap } from 'lucide-react'

const withTimeout = (p, ms = 6000) => Promise.race([
  p,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
])

export default function Prizes() {
  const { attendee, loading: authLoading } = useAuth()
  const [myTickets, setMyTickets]   = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [myActions, setMyActions]   = useState([])
  const [event, setEvent]           = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (attendee?.id) {
      loadData()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [attendee?.id, authLoading])

  async function loadData() {
    try {
      // Active event (for prize description)
      const { data: ev } = await withTimeout(supabase.from('events').select('*').eq('is_active', true).single())
      setEvent(ev || null)

      // My ticket count
      const count = await getTicketCount(attendee.id)
      setMyTickets(count)

      // My earned actions
      const { data: actions } = await withTimeout(supabase
        .from('draw_tickets')
        .select('action, description, earned_at')
        .eq('attendee_id', attendee.id)
        .order('earned_at', { ascending: false }))
      setMyActions(actions || [])

      // Leaderboard — top 10 by ticket count
      const { data: lb } = await withTimeout(supabase
        .from('draw_tickets')
        .select('attendee_id, attendees(id, name, company, photo_url)')
        .order('earned_at', { ascending: false }))

      if (lb) {
        const scoreMap = {}
        lb.forEach(r => {
          if (!r.attendees) return
          const id = r.attendee_id
          if (!scoreMap[id]) scoreMap[id] = { person: r.attendees, count: 0 }
          scoreMap[id].count++
        })
        const sorted = Object.values(scoreMap).sort((a, b) => b.count - a.count).slice(0, 10)
        setLeaderboard(sorted)
      }
    } catch (err) {
      console.error('loadData error:', err)
    } finally {
      setLoading(false)
    }
  }

  // How many of the one-time actions have been done
  const oneTimeActions = [
    { key: 'PROFILE_COMPLETE', label: 'Complete your profile',        tickets: 3, action: 'profile_complete' },
    { key: 'GDPR_CONSENT',     label: 'Accept privacy policy',        tickets: 1, action: 'gdpr_consent' },
    { key: 'FIRST_CONNECTION', label: 'Make your first connection',   tickets: 2, action: 'first_connection' },
    { key: 'SURVEY_COMPLETE',  label: 'Complete the event survey',    tickets: 3, action: 'survey_complete' },
  ]
  const earnedActions = new Set(myActions.map(a => a.action))

  const repeatActions = [
    { label: 'Connect with an attendee',         tickets: 1, action: 'connection' },
    { label: 'Check in to a session',            tickets: 1, action: 'session_checkin' },
    { label: 'Express interest in a topic',      tickets: 1, action: 'interest_flag' },
    { label: 'Request "want more info" on topic', tickets: 2, action: 'want_more_info' },
    { label: 'Request a meeting',                tickets: 1, action: 'meeting_request' },
  ]

  const myRank = leaderboard.findIndex(l => l.person.id === attendee?.id) + 1

  return (
    <Layout title="Prize Draw">
      <div className="p-4 space-y-4">

        {/* Prize description card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-brand-700 to-brand-900 px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-200 uppercase tracking-wide">What's up for grabs?</p>
              <p className="text-white font-bold text-lg leading-tight">
                {event?.prize_description ? event.prize_description.split('\n')[0] : 'Grand Prize'}
              </p>
            </div>
          </div>
          {event?.prize_description && event.prize_description.includes('\n') && (
            <div className="px-5 py-3">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {event.prize_description.split('\n').slice(1).join('\n').trim()}
              </p>
            </div>
          )}
          {!event?.prize_description && (
            <div className="px-5 py-3">
              <p className="text-sm text-gray-400 italic">
                Prize details will be announced soon — keep collecting tickets!
              </p>
            </div>
          )}
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Ticket size={28} className="text-white" />
          </div>
          <p className="text-5xl font-black mb-1">{myTickets}</p>
          <p className="text-yellow-100 font-medium">raffle tickets</p>
          {myRank > 0 && (
            <p className="text-yellow-100 text-sm mt-2">You're ranked #{myRank} on the leaderboard!</p>
          )}
        </div>

        {/* How to earn more */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" /> How to earn tickets
          </h2>
          <div className="space-y-2">
            {oneTimeActions.map(a => (
              <div key={a.key} className={`flex items-center justify-between text-sm ${earnedActions.has(a.action) ? 'opacity-50' : ''}`}>
                <span className={`flex-1 ${earnedActions.has(a.action) ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {earnedActions.has(a.action) ? '✓ ' : ''}{a.label}
                </span>
                <span className="text-yellow-600 font-semibold ml-2">+{a.tickets}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <p className="text-xs text-gray-400 mb-2">Repeatable (per action)</p>
              {repeatActions.map(a => (
                <div key={a.action} className="flex items-center justify-between text-sm">
                  <span className="flex-1 text-gray-700">{a.label}</span>
                  <span className="text-yellow-600 font-semibold ml-2">+{a.tickets}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" /> Leaderboard
          </h2>
          {loading ? (
            <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map(({ person, count }, index) => {
                const isMe = person.id === attendee?.id
                return (
                  <div key={person.id} className={`flex items-center gap-3 py-2 rounded-xl px-2 ${isMe ? 'bg-brand-50' : ''}`}>
                    <span className={`w-6 text-center text-sm font-bold ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-400'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>
                    <Avatar name={person.name} photoUrl={person.photo_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-brand-700' : 'text-gray-800'}`}>
                        {isMe ? 'You' : person.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{person.company}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Ticket size={13} className="text-yellow-500" />
                      <span className="text-sm font-bold text-gray-700">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
