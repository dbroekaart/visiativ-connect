import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { awardTickets, hasEarnedTicket } from '../lib/tickets'
import { CheckCircle, User, Building, Briefcase, FileText, Shield } from 'lucide-react'

const STEPS = ['Welcome', 'About You', 'Privacy', 'Done']

export default function ProfileSetup() {
  const { attendee, refreshAttendee } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    name:       attendee?.name || '',
    company:    attendee?.company || '',
    job_title:  attendee?.job_title || '',
    bio:        attendee?.bio || '',
    linkedin_url: attendee?.linkedin_url || '',
    gdpr_consent: false,
  })

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleFinish() {
    if (!form.gdpr_consent) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('attendees')
        .update({
          name:             form.name.trim(),
          company:          form.company.trim(),
          job_title:        form.job_title.trim(),
          bio:              form.bio.trim(),
          linkedin_url:     (form.linkedin_url || '').trim(),
          gdpr_consent:     true,
          profile_complete: true,
          updated_at:       new Date().toISOString(),
        })
        .eq('id', attendee.id)

      if (error) {
        console.error('Profile save error:', error)
      }

      // Show success immediately — award tickets + refresh in background
      setLoading(false)
      setStep(3)

      // Background: award tickets and refresh context (non-blocking)
      refreshAttendee().catch(() => {})
      if (!error) {
        hasEarnedTicket(attendee.id, 'profile_complete').then(already => {
          if (!already) awardTickets(attendee.id, 'PROFILE_COMPLETE')
        })
        hasEarnedTicket(attendee.id, 'gdpr_consent').then(already => {
          if (!already) awardTickets(attendee.id, 'GDPR_CONSENT')
        })
      }
    } catch (err) {
      console.error('handleFinish exception:', err)
      setLoading(false)
    }
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You're all set! 🎉</h2>
          <p className="text-gray-500 text-sm mb-2">
            Your profile is complete. You've earned <strong>4 raffle tickets</strong> already!
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Keep earning tickets by connecting with attendees, checking in to sessions, and completing the survey.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl"
          >
            Enter the event →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <p className="text-xs text-gray-400 mb-1">Step {step + 1} of {STEPS.length - 1}</p>

          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Welcome to Visiativ Connect! 👋</h2>
              <p className="text-gray-500 text-sm mb-4">
                Before you dive in, let's set up your profile so other attendees can find and connect with you.
              </p>
              <div className="space-y-2 mb-6">
                {[
                  'See the full event agenda',
                  'Download session content',
                  'Connect & chat with fellow attendees',
                  'Meet your Visiativ account manager',
                  'Enter the prize draw 🎁',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl">
                Let's go →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">About you</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Full name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Company *</label>
                  <div className="relative">
                    <Building size={15} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.company}
                      onChange={e => update('company', e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Job title</label>
                  <div className="relative">
                    <Briefcase size={15} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.job_title}
                      onChange={e => update('job_title', e.target.value)}
                      placeholder="e.g. Design Engineer"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Short bio (optional)</label>
                  <div className="relative">
                    <FileText size={15} className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      rows={2}
                      value={form.bio}
                      onChange={e => update('bio', e.target.value)}
                      placeholder="What do you work on? What are you interested in?"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">LinkedIn URL (optional)</label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.linkedin_url}
                    onChange={e => update('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                    inputMode="url"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-xl text-sm">
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.name.trim() || !form.company.trim()}
                  className="flex-1 bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Shield size={24} className="text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Privacy & data</h2>
              <p className="text-gray-500 text-sm mb-4">
                Before you enter, please confirm you've read and accept how we use your data.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 mb-4 space-y-2">
                <p>Your profile (name, company, job title) will be visible to other event attendees.</p>
                <p>Your topic interests and "want more info" flags will be shared with Visiativ account managers for follow-up.</p>
                <p>Session attendance, connections made, and survey responses will be used for event improvement and sales follow-up.</p>
                <p>Your data will not be sold to third parties.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={form.gdpr_consent}
                  onChange={e => update('gdpr_consent', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-brand-600 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  I agree to the use of my data as described above. I understand I can ask for my data to be deleted at any time by contacting Visiativ.
                </span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-xl text-sm">
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!form.gdpr_consent || loading}
                  className="flex-1 bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-sm"
                >
                  {loading ? 'Saving...' : 'Complete setup →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
