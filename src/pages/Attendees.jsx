import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { Search, Users } from 'lucide-react'

export default function Attendees() {
  const { attendee } = useAuth()
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')

  useEffect(() => { loadAttendees() }, [])

  async function loadAttendees() {
    const { data: ev } = await supabase.from('events').select('id').eq('is_active', true).single()
    if (!ev) { setLoading(false); return }

    const { data } = await supabase
      .from('attendees')
      .select('id, name, company, job_title, bio, photo_url, is_visiativ_staff, profile_complete')
      .eq('event_id', ev.id)
      .eq('profile_complete', true)
      .neq('id', attendee?.id)
      .order('name', { ascending: true })

    setAttendees(data || [])
    setLoading(false)
  }

  const filtered = attendees.filter(a => {
    const matchesSearch = !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.company?.toLowerCase().includes(search.toLowerCase()) ||
      a.job_title?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'visiativ') return matchesSearch && a.is_visiativ_staff
    return matchesSearch
  })

  return (
    <Layout title="People">
      <div className="p-4 space-y-3">

        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="Search by name, company, or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all',      label: 'Everyone' },
            { key: 'visiativ', label: 'Visiativ Team' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 shadow-card'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-xs text-gray-400 px-0.5">{filtered.length} {filtered.length === 1 ? 'person' : 'people'}</p>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No attendees found</p>
            <p className="text-xs text-gray-300 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(person => (
              <Link
                key={person.id}
                to={`/attendees/${person.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-card hover:shadow-card-lg transition-all"
              >
                <Avatar name={person.name} photoUrl={person.photo_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">{person.name}</p>
                    {person.is_visiativ_staff && (
                      <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold">
                        Visiativ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {person.job_title || ''}{person.job_title && person.company ? ' · ' : ''}{person.company || ''}
                  </p>
                </div>
                <svg width="6" height="11" viewBox="0 0 6 11" fill="none" className="text-gray-300 flex-shrink-0">
                  <path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
