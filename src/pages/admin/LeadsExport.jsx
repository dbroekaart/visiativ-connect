import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Download, Filter } from 'lucide-react'

function escapeCsv(val) {
  if (val == null) return ''
  const str = String(val).replace(/"/g, '""')
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
}

function arrayToCsv(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escapeCsv(row[h])).join(',')),
  ]
  return lines.join('\n')
}

function downloadCsv(filename, rows) {
  const csv = arrayToCsv(rows)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export default function LeadsExport() {
  const [loading, setLoading]       = useState(false)
  const [filterAM, setFilterAM]     = useState('')
  const [accountManagers, setAMs]   = useState([])
  const [preview, setPreview]       = useState([])

  async function loadAMs() {
    const { data } = await supabase.from('account_managers').select('*').order('name')
    setAMs(data || [])
  }

  // Load AMs on mount
  useEffect(() => { loadAMs() }, [])

  async function loadLeads() {
    setLoading(true)

    // All interest-based leads
    const { data: interests } = await supabase
      .from('attendee_interests')
      .select(`
        want_more_info, notes,
        attendees(name, email, company, job_title,
          account_managers(name, email)),
        topics(name, category)
      `)
      .eq('want_more_info', true)

    // All survey follow-up leads
    const { data: surveys } = await supabase
      .from('surveys')
      .select(`
        satisfaction_score, follow_up_topics, submitted_at,
        attendees(name, email, company, job_title,
          account_managers(name, email))
      `)
      .eq('follow_up_interest', true)

    // Session attendance per attendee
    const { data: attendance } = await supabase
      .from('session_attendance')
      .select(`
        checked_in_at,
        attendees(name, email, company),
        sessions(title, start_time, topics(name))
      `)

    // Build leads rows
    const rows = []

    // Interest leads
    interests?.forEach(i => {
      const a = i.attendees
      if (!a) return
      if (filterAM && a.account_managers?.email !== filterAM) return
      rows.push({
        lead_type: 'Topic interest',
        attendee_name: a.name,
        attendee_email: a.email,
        company: a.company,
        job_title: a.job_title,
        account_manager: a.account_managers?.name || '',
        am_email: a.account_managers?.email || '',
        topic: i.topics?.name || '',
        topic_category: i.topics?.category || '',
        notes: i.notes || '',
        sessions_attended: attendance?.filter(att => att.attendees?.email === a.email).map(att => att.sessions?.title).filter(Boolean).join('; ') || '',
        survey_score: '',
        survey_follow_up_topics: '',
      })
    })

    // Survey follow-up leads
    surveys?.forEach(s => {
      const a = s.attendees
      if (!a) return
      if (filterAM && a.account_managers?.email !== filterAM) return
      // Only add if not already in list from interests
      const alreadyAdded = rows.some(r => r.attendee_email === a.email && r.lead_type === 'Survey follow-up')
      if (!alreadyAdded) {
        rows.push({
          lead_type: 'Survey follow-up',
          attendee_name: a.name,
          attendee_email: a.email,
          company: a.company,
          job_title: a.job_title,
          account_manager: a.account_managers?.name || '',
          am_email: a.account_managers?.email || '',
          topic: '',
          topic_category: '',
          notes: '',
          sessions_attended: attendance?.filter(att => att.attendees?.email === a.email).map(att => att.sessions?.title).filter(Boolean).join('; ') || '',
          survey_score: s.satisfaction_score,
          survey_follow_up_topics: s.follow_up_topics || '',
        })
      }
    })

    setPreview(rows)
    setLoading(false)
    return rows
  }

  async function handleExport() {
    const rows = await loadLeads()
    if (rows.length === 0) {
      alert('No leads found with the current filters.')
      return
    }
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(`visiativ_leads_${date}.csv`, rows)
  }

  async function handleAttendanceExport() {
    setLoading(true)
    const { data: attendance } = await supabase
      .from('session_attendance')
      .select(`
        checked_in_at,
        attendees(name, email, company, job_title, account_managers(name, email)),
        sessions(title, start_time, room)
      `)
      .order('checked_in_at', { ascending: true })

    const rows = (attendance || []).map(a => ({
      attendee_name:    a.attendees?.name,
      email:            a.attendees?.email,
      company:          a.attendees?.company,
      job_title:        a.attendees?.job_title,
      account_manager:  a.attendees?.account_managers?.name,
      am_email:         a.attendees?.account_managers?.email,
      session:          a.sessions?.title,
      session_time:     a.sessions?.start_time,
      room:             a.sessions?.room,
      checked_in_at:    a.checked_in_at,
    }))

    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(`visiativ_session_attendance_${date}.csv`, rows)
    setLoading(false)
  }

  async function handleSurveyExport() {
    setLoading(true)
    const { data: surveys } = await supabase
      .from('surveys')
      .select('*, attendees(name, email, company, job_title, account_managers(name, email))')
      .order('submitted_at', { ascending: false })

    const rows = (surveys || []).map(s => ({
      attendee_name:        s.attendees?.name,
      email:                s.attendees?.email,
      company:              s.attendees?.company,
      account_manager:      s.attendees?.account_managers?.name,
      satisfaction_score:   s.satisfaction_score,
      highlights:           s.highlights,
      improvements:         s.improvements,
      wants_follow_up:      s.follow_up_interest ? 'Yes' : 'No',
      follow_up_topics:     s.follow_up_topics,
      submitted_at:         s.submitted_at,
    }))

    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(`visiativ_surveys_${date}.csv`, rows)
    setLoading(false)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Leads & Data Export</h2>
        <p className="text-sm text-gray-500 mt-1">Export leads and engagement data for your CRM or account managers.</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <select
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={filterAM}
          onChange={e => setFilterAM(e.target.value)}
        >
          <option value="">All account managers</option>
          {accountManagers.map(am => (
            <option key={am.id} value={am.email}>{am.name}</option>
          ))}
        </select>
      </div>

      {/* Export cards */}
      <div className="space-y-3">
        <ExportCard
          title="🎯 Sales leads"
          description="All attendees who marked 'want more info' on a topic or requested follow-up in the survey. Includes sessions attended and account manager assignment."
          buttonLabel="Export leads CSV"
          onExport={handleExport}
          loading={loading}
          accent="red"
        />
        <ExportCard
          title="📊 Session attendance"
          description="Who attended which sessions — useful for understanding product interest by attendee."
          buttonLabel="Export attendance CSV"
          onExport={handleAttendanceExport}
          loading={loading}
          accent="blue"
        />
        <ExportCard
          title="⭐ Survey responses"
          description="All survey submissions with satisfaction scores, highlights, improvements, and follow-up interest."
          buttonLabel="Export surveys CSV"
          onExport={handleSurveyExport}
          loading={loading}
          accent="yellow"
        />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{preview.length} leads found</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['Lead type', 'Name', 'Company', 'Topic', 'Account Manager'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-700">{row.lead_type}</td>
                    <td className="px-3 py-2 text-gray-700 truncate max-w-32">{row.attendee_name}</td>
                    <td className="px-3 py-2 text-gray-500 truncate max-w-32">{row.company}</td>
                    <td className="px-3 py-2 text-gray-500 truncate max-w-32">{row.topic}</td>
                    <td className="px-3 py-2 text-gray-500 truncate max-w-32">{row.account_manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 10 && <p className="text-xs text-gray-400 text-center py-2">…and {preview.length - 10} more rows in the download</p>}
        </div>
      )}
    </div>
  )
}

function ExportCard({ title, description, buttonLabel, onExport, loading, accent }) {
  const accents = {
    red:    'border-red-200 bg-red-50',
    blue:   'border-blue-200 bg-blue-50',
    yellow: 'border-yellow-200 bg-yellow-50',
  }
  return (
    <div className={`border rounded-2xl p-4 ${accents[accent]}`}>
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600 mt-1 mb-3">{description}</p>
      <button
        onClick={onExport}
        disabled={loading}
        className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
      >
        <Download size={14} />
        {loading ? 'Preparing…' : buttonLabel}
      </button>
    </div>
  )
}
