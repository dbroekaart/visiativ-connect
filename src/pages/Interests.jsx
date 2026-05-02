import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { awardTickets, hasEarnedTicket } from '../lib/tickets'
import Layout from '../components/Layout'
import { Heart, Info, CheckCircle } from 'lucide-react'

export default function Interests() {
  const { attendee, loading: authLoading } = useAuth()
  const [topics, setTopics]       = useState([])
  const [myInterests, setMyInterests] = useState({}) // topicId -> { want_more_info, is_public }
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    if (attendee?.id) {
      loadData()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [attendee?.id, authLoading])

  async function loadData() {
    try {
      const withTimeout = (p) => Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
      ])
      const [topicsRes, interestsRes] = await Promise.all([
        withTimeout(supabase.from('topics').select('*').order('sort_order')),
        withTimeout(supabase.from('attendee_interests').select('*').eq('attendee_id', attendee.id)),
      ])
      // Deduplicate by name in case topics were seeded more than once
      const seen = new Set()
      const unique = (topicsRes.data || []).filter(t => {
        if (seen.has(t.name)) return false
        seen.add(t.name)
        return true
      })
      setTopics(unique)
      const map = {}
      interestsRes.data?.forEach(i => { map[i.topic_id] = i })
      setMyInterests(map)
    } catch (err) {
      console.error('loadData error:', err)
    } finally {
      setLoading(false)
    }
  }

  function toggleInterest(topicId) {
    setMyInterests(prev => {
      const current = prev[topicId]
      if (current) {
        const { [topicId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [topicId]: { want_more_info: false, is_public: true } }
    })
  }

  function toggleMoreInfo(topicId) {
    setMyInterests(prev => ({
      ...prev,
      [topicId]: { ...prev[topicId], want_more_info: !prev[topicId]?.want_more_info },
    }))
  }

  async function handleSave() {
    if (!attendee?.id) return
    setSaving(true)

    // Delete all existing interests
    await supabase.from('attendee_interests').delete().eq('attendee_id', attendee.id)

    // Insert new ones
    const rows = Object.entries(myInterests).map(([topic_id, data]) => ({
      attendee_id: attendee.id,
      topic_id,
      want_more_info: data.want_more_info || false,
      is_public: data.is_public !== false,
    }))

    if (rows.length > 0) {
      await supabase.from('attendee_interests').insert(rows)
    }

    // Award tickets
    const hadInterest = await hasEarnedTicket(attendee.id, 'interest_flag')
    if (!hadInterest && rows.length > 0) await awardTickets(attendee.id, 'INTEREST_FLAG')
    const hadMoreInfo = await hasEarnedTicket(attendee.id, 'want_more_info')
    if (!hadMoreInfo && rows.some(r => r.want_more_info)) await awardTickets(attendee.id, 'WANT_MORE_INFO')

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const categories = [...new Set(topics.map(t => t.category))]

  return (
    <Layout title="My Interests">
      <div className="p-4 space-y-4">
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-brand-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-brand-800 font-medium">Why set your interests?</p>
              <p className="text-xs text-brand-600 mt-1">
                Your interests are visible to other attendees so they can find you as a networking match.
                Mark "Want info" on topics where you'd like Visiativ to follow up after the event — this earns you +2 tickets!
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
        ) : (
          <>
            {categories.map(cat => (
              <div key={cat}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</h2>
                <div className="space-y-2">
                  {topics.filter(t => t.category === cat).map(topic => {
                    const selected = !!myInterests[topic.id]
                    const wantMore = myInterests[topic.id]?.want_more_info || false
                    return (
                      <div key={topic.id}
                        className={`bg-white border rounded-2xl p-3 transition-colors ${selected ? 'border-brand-400' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleInterest(topic.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              selected ? 'bg-brand-600 border-brand-600' : 'border-gray-300'
                            }`}
                          >
                            {selected && <CheckCircle size={14} className="text-white" />}
                          </button>
                          <span className="text-lg">{topic.icon}</span>
                          <span className="flex-1 text-sm font-medium text-gray-800">{topic.name}</span>
                        </div>

                        {selected && (
                          <div className="mt-2 ml-9">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={wantMore}
                                onChange={() => toggleMoreInfo(topic.id)}
                                className="rounded border-gray-300 text-brand-600 w-4 h-4"
                              />
                              <span className="text-xs text-gray-600">
                                🙋 I'd like Visiativ to contact me about this <span className="text-brand-600 font-medium">(+2 tickets)</span>
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full font-semibold py-3 rounded-2xl transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save my interests'}
            </button>
          </>
        )}
      </div>
    </Layout>
  )
}
