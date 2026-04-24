import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAnalytics() }, [])

  async function loadAnalytics() {
    const withTimeout = (p) => Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ])
    try {
      const [
        { data: sessions },
        { data: interests },
        { data: surveys },
        { data: topConnectors },
        { data: attendanceBySession },
      ] = await Promise.all([
        withTimeout(supabase.from('sessions').select('id, title, start_time')),
        withTimeout(supabase.from('attendee_interests').select('topic_id, want_more_info, topics(name, icon)')),
        withTimeout(supabase.from('surveys').select('satisfaction_score, follow_up_interest, follow_up_topics')),
        withTimeout(supabase.from('connections').select('requester_id, target_id, attendees!connections_requester_id_fkey(name, company)').eq('status', 'accepted').limit(100)),
        withTimeout(supabase.from('session_attendance').select('session_id, sessions(title)')),
      ])

      // Interest counts by topic
      const topicCounts = {}
      interests?.forEach(i => {
        const name = i.topics?.name || 'Unknown'
        if (!topicCounts[name]) topicCounts[name] = { name, total: 0, wantMoreInfo: 0, icon: i.topics?.icon }
        topicCounts[name].total++
        if (i.want_more_info) topicCounts[name].wantMoreInfo++
      })
      const topTopics = Object.values(topicCounts).sort((a, b) => b.total - a.total).slice(0, 8)

      // Session attendance counts
      const sessionCounts = {}
      attendanceBySession?.forEach(a => {
        const title = a.sessions?.title || 'Unknown'
        sessionCounts[title] = (sessionCounts[title] || 0) + 1
      })
      const topSessions = Object.entries(sessionCounts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([title, count]) => ({ title, count }))

      // Survey stats
      const validScores = surveys?.filter(s => s.satisfaction_score).map(s => s.satisfaction_score) || []
      const avgScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : null
      const scoreDistribution = [1, 2, 3, 4, 5].map(n => ({
        score: n,
        count: validScores.filter(s => s === n).length,
        label: ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'][n - 1],
      }))

      setData({ topTopics, topSessions, avgScore, scoreDistribution, totalSurveys: surveys?.length || 0, followUpCount: surveys?.filter(s => s.follow_up_interest).length || 0 })
    } catch (err) {
      console.error('loadAnalytics error:', err)
      setData({ topTopics: [], topSessions: [], avgScore: null, scoreDistribution: [], totalSurveys: 0, followUpCount: 0 })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
  if (!data) return null

  const maxTopicCount = Math.max(...data.topTopics.map(t => t.total), 1)
  const maxSessionCount = Math.max(...data.topSessions.map(s => s.count), 1)
  const maxScoreCount = Math.max(...data.scoreDistribution.map(s => s.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Engagement and interest data from your attendees.</p>
      </div>

      {/* Survey scores */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Event satisfaction</h3>
          <div className="text-right">
            {data.avgScore && <p className="text-2xl font-bold text-brand-600">{data.avgScore} / 5</p>}
            <p className="text-xs text-gray-400">{data.totalSurveys} responses · {data.followUpCount} want follow-up</p>
          </div>
        </div>
        <div className="space-y-2">
          {data.scoreDistribution.reverse().map(({ score, count, label }) => (
            <div key={score} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 flex-shrink-0">{score}★ {label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="bg-yellow-400 h-3 rounded-full transition-all" style={{ width: `${(count / maxScoreCount) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topic interests */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Topic interests</h3>
        <div className="space-y-2">
          {data.topTopics.map(topic => (
            <div key={topic.name} className="flex items-center gap-3">
              <span className="text-sm w-40 flex-shrink-0 truncate">{topic.icon} {topic.name}</span>
              <div className="flex-1 relative">
                <div className="bg-gray-100 rounded-full h-5">
                  <div className="bg-brand-500 h-5 rounded-full" style={{ width: `${(topic.total / maxTopicCount) * 100}%` }} />
                  {topic.wantMoreInfo > 0 && (
                    <div className="absolute inset-0 flex items-center">
                      <div className="bg-brand-800 h-5 rounded-full" style={{ width: `${(topic.wantMoreInfo / maxTopicCount) * 100}%` }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 w-24 text-right flex-shrink-0">
                {topic.total} total · <span className="text-brand-700 font-medium">{topic.wantMoreInfo} leads</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Dark bar = "want more info" (direct sales leads)</p>
      </div>

      {/* Session attendance */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Session attendance (check-ins)</h3>
        {data.topSessions.length === 0 ? (
          <p className="text-sm text-gray-400">No check-ins yet.</p>
        ) : (
          <div className="space-y-2">
            {data.topSessions.map(s => (
              <div key={s.title} className="flex items-center gap-3">
                <span className="text-sm flex-1 truncate">{s.title}</span>
                <div className="w-24 bg-gray-100 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(s.count / maxSessionCount) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
