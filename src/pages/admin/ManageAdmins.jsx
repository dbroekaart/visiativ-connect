import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../../components/Avatar'
import { UserPlus, Trash2, ShieldCheck, X, CheckCircle } from 'lucide-react'

export default function ManageAdmins() {
  const { attendee: me } = useAuth()
  const [admins, setAdmins]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [email, setEmail]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [result, setResult]     = useState(null) // { type: 'success'|'error', msg }
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { loadAdmins() }, [])

  async function loadAdmins() {
    setLoading(true)
    const { data } = await supabase
      .from('attendees')
      .select('id, name, email, company, job_title, photo_url')
      .eq('is_admin', true)
      .order('name')
    setAdmins(data || [])
    setLoading(false)
  }

  async function handleGrant() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    setSaving(true)
    setResult(null)

    const { data: found, error } = await supabase
      .from('attendees')
      .select('id, name, email, is_admin')
      .eq('email', trimmed)
      .maybeSingle()

    if (error || !found) {
      setResult({ type: 'error', msg: `No attendee found with email "${trimmed}". They must be registered first.` })
      setSaving(false)
      return
    }

    if (found.is_admin) {
      setResult({ type: 'error', msg: `${found.name} is already an admin.` })
      setSaving(false)
      return
    }

    const { error: updateErr } = await supabase
      .from('attendees')
      .update({ is_admin: true })
      .eq('id', found.id)

    if (updateErr) {
      setResult({ type: 'error', msg: updateErr.message })
    } else {
      setResult({ type: 'success', msg: `${found.name} is now an admin.` })
      setEmail('')
      await loadAdmins()
    }
    setSaving(false)
  }

  async function handleRevoke(id) {
    if (id === me?.id) {
      setResult({ type: 'error', msg: "You can't remove your own admin rights." })
      setDeleteId(null)
      return
    }
    await supabase.from('attendees').update({ is_admin: false }).eq('id', id)
    setDeleteId(null)
    await loadAdmins()
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Admin Access</h2>
        <p className="text-sm text-gray-500 mt-1">
          Grant or remove admin rights. Admins can access this dashboard, manage the event, attendees, and export leads.
        </p>
      </div>

      {result && (
        <div className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${
          result.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {result.type === 'success'
            ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            : <X size={16} className="mt-0.5 flex-shrink-0" />
          }
          <span>{result.msg}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <UserPlus size={15} className="text-brand-600" />
          Add admin by email
        </h3>
        <p className="text-xs text-gray-500">
          The person must already be registered as an attendee. Enter their email address to grant admin access.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setResult(null) }}
            onKeyDown={e => e.key === 'Enter' && handleGrant()}
            placeholder="colleague@visiativ.com"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={handleGrant}
            disabled={saving || !email.trim()}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <ShieldCheck size={15} />
            }
            Grant
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Current admins ({admins.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand-600" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No admins found.</div>
        ) : (
          <div className="space-y-2">
            {admins.map(admin => (
              <div key={admin.id}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <Avatar name={admin.name} photoUrl={admin.photo_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate">{admin.name}</span>
                    {admin.id === me?.id && (
                      <span className="text-xs bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">you</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{admin.email}</p>
                  {admin.job_title && <p className="text-xs text-gray-400 truncate">{admin.job_title}{admin.company ? ` · ${admin.company}` : ''}</p>}
                </div>

                {deleteId === admin.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-red-600">Remove?</span>
                    <button
                      onClick={() => handleRevoke(admin.id)}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                    >Yes</button>
                    <button
                      onClick={() => { setDeleteId(null); setResult(null) }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    >No</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setDeleteId(admin.id); setResult(null) }}
                    disabled={admin.id === me?.id}
                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-0 disabled:cursor-default flex-shrink-0"
                    title="Remove admin"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Admin rights only control access to this dashboard. They don't affect what attendees see in the app.
      </p>
    </div>
  )
}
