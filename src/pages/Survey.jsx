import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { awardTickets, hasEarnedTicket } from '../lib/tickets'
import Layout from '../components/Layout'
import { Star, CheckCircle } from 'lucide-react'

const withTimeout = (p, ms = 6000) => Promise.race([
  p,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
])

export default function Survey() {
  const { attendee, loading: authLoading } = useAuth()
  const [existing, setExisting] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)
  const [form, setForm]         = useState({
    satisfaction_score: 0,
    highlights: '',
    improvements: '',
    follow_up_interest: false,
    follow_up_topics: '',
  })

  useEffect(() => {
    if (attendee?.id) {
      loadExisting()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [attendee?.id, authLoading])

  async function loadExisting() {
    try {
      const { data: ev } = await withTimeout(supabase.from('events').select('id').eq('is_active', true).single())
      if (!ev) { setLoading(false); return }

      const { data } = await withTimeout(supabase
        .from('surveys')
        .select('*')
        .eq('attendee_id', attendee.id)
        .eq('event_id', ev.id)
        .single())

      if (data) {
        setExisting(data)
        setForm({
          satisfaction_score: data.satisfaction_score,
          highlights: data.highlights || '',
          improvements: data.improvements || '',
          follow_up_interest: data.follow_up_interest,
          follow_up_topics: data.follow_up_topics || '',
        })
      }
    } catch (err) {
      console.error('loadExisting error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.satisfaction_score) return
    setSubmitting(true)

    const { data: ev } = await supabase.from('events').select('id').eq('is_active', true).single()

    const payload = {
      attendee_id: attendee.id,
      event_id: ev?.id,
      satisfaction_score: form.satisfaction_score,
      highlights: form.highlights.trim(),
      improvements: form.improvements.trim(),
      follow_up_interest: form.follow_up_interest,
      follow_up_topics: form.follow_up_topics.trim(),
    }

    if (existing) {
      await supabase.from('surveys').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('surveys').insert(payload)
      // Award tickets first time
      const already = await hasEarnedTicket(attendee.id, 'survey_complete')
      if (!already) await awardTickets(attendee.id, 'SURVEY_COMPLETE')
    }

    setSubmitting(false)
    setDone(true)
  }

  const stars = [1, 2, 3, 4, 5]
  const labels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very good', 5: 'Excellent!' }

  if (loading) return (
    <Layout title="Event Survey">
      <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
    </Layout>
  )

  if (done) return (
    <Layout title="Event Survey">
      <div className="flex flex-col items-center justify-center p-8 text-center mt-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you! 🎉</h2>
        <p className="text-gray-500 text-sm mb-1">Your feedback has been submitted.</p>
        <p className="text-brand-600 text-sm font-medium">+3 raffle tickets added to your balance!</p>
      </div>
    </Layout>
  )

  return (
    <Layout title="Event Survey">
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        {!existing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-yellow-800">Complete this survey to earn <strong>+3 raffle tickets!</strong></p>
          </div>
        )}

        {/* Star rating */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-center">Overall, how would you rate this event?</h2>
          <div className="flex justify-center gap-3 mb-2">
            {stars.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, satisfaction_score: n }))}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={36}
                  className={n <= form.satisfaction_score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>
          {form.satisfaction_score > 0 && (
            <p className="text-center text-sm font-medium text-brand-600">{labels[form.satisfaction_score]}</p>
          )}
        </div>

        {/* Highlights */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            What did you enjoy most?
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            rows={3}
            placeholder="Sessions, networking, demonstrations…"
            value={form.highlights}
            onChange={e => setForm(prev => ({ ...prev, highlights: e.target.value }))}
          />
        </div>

        {/* Improvements */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            What could we improve?
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            rows={3}
            placeholder="Be honest — we want to improve!"
            value={form.improvements}
            onChange={e => setForm(prev => ({ ...prev, improvements: e.target.value }))}
          />
        </div>

        {/* Follow-up interest */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.follow_up_interest}
              onChange={e => setForm(prev => ({ ...prev, follow_up_interest: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-brand-600 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">I'd like to be contacted for a follow-up</p>
              <p className="text-xs text-gray-500 mt-0.5">A Visiativ account manager will reach out after the event.</p>
            </div>
          </label>
          {form.follow_up_interest && (
            <textarea
              className="w-full mt-3 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              rows={2}
              placeholder="Which topics are you most interested in discussing?"
              value={form.follow_up_topics}
              onChange={e => setForm(prev => ({ ...prev, follow_up_topics: e.target.value }))}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={!form.satisfaction_score || submitting}
          className="w-full bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-2xl"
        >
          {submitting ? 'Submitting…' : existing ? 'Update my feedback' : 'Submit survey (+3 tickets)'}
        </button>
      </form>
    </Layout>
  )
}
