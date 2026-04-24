import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react'

const EMPTY_SESSION = {
  title: '', description: '', speaker_name: '', speaker_bio: '',
  start_time: '', end_time: '', room: '', topic_id: '', is_published: true,
  content_url: '', content_filename: '', sort_order: 0,
}

export default function ManageAgenda() {
  const [sessions, setSessions] = useState([])
  const [topics, setTopics]     = useState([])
  const [eventId, setEventId]   = useState(null)
  const [editing, setEditing]   = useState(null) // null | 'new' | session object
  const [form, setForm]         = useState(EMPTY_SESSION)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const withTimeout = (p) => Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ])
    try {
      const { data: ev } = await withTimeout(supabase.from('events').select('id').eq('is_active', true).single())
      setEventId(ev?.id || null)
      if (!ev?.id) return

      const [{ data: s }, { data: t }] = await Promise.all([
        withTimeout(supabase.from('sessions').select('*, topics(name, icon)').eq('event_id', ev.id).order('start_time')),
        withTimeout(supabase.from('topics').select('*').order('sort_order')),
      ])
      setSessions(s || [])
      setTopics(t || [])
    } catch (err) {
      console.error('loadData error:', err)
    }
  }

  function startNew() {
    setEditing('new')
    setForm({ ...EMPTY_SESSION })
  }

  function startEdit(session) {
    setEditing(session)
    setForm({
      title: session.title || '', description: session.description || '',
      speaker_name: session.speaker_name || '', speaker_bio: session.speaker_bio || '',
      start_time: session.start_time ? session.start_time.slice(0, 16) : '',
      end_time:   session.end_time   ? session.end_time.slice(0, 16)   : '',
      room: session.room || '', topic_id: session.topic_id || '',
      is_published: session.is_published, content_url: session.content_url || '',
      content_filename: session.content_filename || '', sort_order: session.sort_order || 0,
    })
  }

  async function handleUploadFile(e) {
    const file = e.target.files[0]
    if (!file || !eventId) return
    setUploading(true)

    const path = `sessions/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('session-content').upload(path, file)

    if (!error) {
      const { data: urlData } = supabase.storage.from('session-content').getPublicUrl(path)
      setForm(prev => ({ ...prev, content_url: urlData.publicUrl, content_filename: file.name }))
    }
    setUploading(false)
  }

  async function handleSave() {
    if (!form.title.trim() || !eventId) return
    setSaving(true)

    const payload = {
      ...form,
      event_id: eventId,
      start_time: form.start_time || null,
      end_time:   form.end_time   || null,
      topic_id:   form.topic_id   || null,
    }

    if (editing === 'new') {
      await supabase.from('sessions').insert(payload)
    } else {
      await supabase.from('sessions').update(payload).eq('id', editing.id)
    }

    setSaving(false)
    setEditing(null)
    await loadData()
  }

  async function handleDelete(sessionId) {
    if (!confirm('Delete this session?')) return
    await supabase.from('sessions').delete().eq('id', sessionId)
    await loadData()
  }

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Agenda</h2>
          <p className="text-sm text-gray-500">Add sessions and upload content for attendees to download.</p>
        </div>
        {!editing && (
          <button onClick={startNew} className="flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus size={16} /> Add session
          </button>
        )}
      </div>

      {!eventId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
          No active event found. Please create an event first under "Event" settings.
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{editing === 'new' ? 'New session' : 'Edit session'}</h3>
            <button onClick={() => setEditing(null)}><X size={20} className="text-gray-400" /></button>
          </div>
          <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Session title *" value={form.title} onChange={e => f('title', e.target.value)} />
          <textarea className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={3}
            placeholder="Description" value={form.description} onChange={e => f('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start time</label>
              <input type="datetime-local" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.start_time} onChange={e => f('start_time', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End time</label>
              <input type="datetime-local" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.end_time} onChange={e => f('end_time', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Room / location" value={form.room} onChange={e => f('room', e.target.value)} />
            <select className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.topic_id} onChange={e => f('topic_id', e.target.value)}>
              <option value="">No topic</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Speaker name" value={form.speaker_name} onChange={e => f('speaker_name', e.target.value)} />
            <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Speaker bio (short)" value={form.speaker_bio} onChange={e => f('speaker_bio', e.target.value)} />
          </div>

          {/* File upload */}
          <div className="border border-dashed border-gray-300 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-2">Session content (PDF, slides, etc.)</p>
            {form.content_url ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span>✓ {form.content_filename || 'File uploaded'}</span>
                <button onClick={() => f('content_url', '')} className="text-red-500 text-xs">Remove</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-600">
                <Upload size={15} />
                {uploading ? 'Uploading…' : 'Upload file'}
                <input type="file" className="hidden" onChange={handleUploadFile} disabled={uploading} />
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="published" checked={form.is_published} onChange={e => f('is_published', e.target.checked)}
              className="rounded border-gray-300 text-brand-600 w-4 h-4" />
            <label htmlFor="published" className="text-sm text-gray-700">Published (visible to attendees)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditing(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title}
              className="flex-1 bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl text-sm">
              {saving ? 'Saving…' : 'Save session'}
            </button>
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-2">
        {sessions.length === 0 && !editing && (
          <p className="text-center text-gray-400 text-sm py-8">No sessions yet. Add one above!</p>
        )}
        {sessions.map(s => (
          <div key={s.id} className={`bg-white border border-gray-200 rounded-2xl p-4 ${!s.is_published ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{s.title}</p>
                  {!s.is_published && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Draft</span>}
                  {s.content_url && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Has content</span>}
                </div>
                {s.start_time && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(s.start_time).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    {s.room ? ` · ${s.room}` : ''}
                  </p>
                )}
                {s.speaker_name && <p className="text-xs text-gray-400 mt-0.5">Speaker: {s.speaker_name}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(s)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
