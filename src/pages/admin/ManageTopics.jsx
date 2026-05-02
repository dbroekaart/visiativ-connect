import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, GripVertical, CheckCircle, X, Pencil } from 'lucide-react'

const CATEGORY_SUGGESTIONS = ['Solutions', 'Technologies', 'Industries', 'Business Topics']

const EMPTY_FORM = { name: '', category: '', icon: '🏷️', sort_order: 0 }

export default function ManageTopics() {
  const [topics, setTopics]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [editId, setEditId]     = useState(null)   // null = no edit, 'new' = adding
  const [form, setForm]         = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState(null)
  const [error, setError]       = useState('')

  useEffect(() => { loadTopics() }, [])

  async function loadTopics() {
    setLoading(true)
    const { data } = await supabase.from('topics').select('*').order('category').order('sort_order')
    setTopics(data || [])
    setLoading(false)
  }

  function startNew() {
    const maxOrder = topics.length > 0 ? Math.max(...topics.map(t => t.sort_order || 0)) + 1 : 0
    setForm({ ...EMPTY_FORM, sort_order: maxOrder })
    setEditId('new')
    setError('')
  }

  function startEdit(topic) {
    setForm({ name: topic.name, category: topic.category || '', icon: topic.icon || '🏷️', sort_order: topic.sort_order || 0 })
    setEditId(topic.id)
    setError('')
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.category.trim()) { setError('Category is required.'); return }
    setSaving(true)
    setError('')

    const payload = {
      name:       form.name.trim(),
      category:   form.category.trim(),
      icon:       form.icon.trim() || '🏷️',
      sort_order: parseInt(form.sort_order) || 0,
    }

    if (editId === 'new') {
      const { error: err } = await supabase.from('topics').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('topics').update(payload).eq('id', editId)
      if (err) { setError(err.message); setSaving(false); return }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    setEditId(null)
    await loadTopics()
  }

  async function handleDelete(id) {
    // Check if any attendees have this interest
    const { count } = await supabase
      .from('attendee_interests')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', id)

    if (count > 0) {
      setError(`Cannot delete — ${count} attendee(s) have this interest selected.`)
      setDeleteId(null)
      return
    }

    await supabase.from('topics').delete().eq('id', id)
    setDeleteId(null)
    await loadTopics()
  }

  const categories = [...new Set(topics.map(t => t.category).filter(Boolean))]

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Interest Topics</h2>
          <p className="text-sm text-gray-500 mt-1">Manage the topics attendees can select as interests.</p>
        </div>
        {editId === null && (
          <button
            onClick={startNew}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Add topic
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
          <X size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit form */}
      {editId !== null && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">{editId === 'new' ? 'New topic' : 'Edit topic'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Topic name *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. AI & Automation"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Icon (emoji) *</label>
              <input
                value={form.icon}
                onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                placeholder="🤖"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <input
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                list="category-suggestions"
                placeholder="e.g. Technologies"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <datalist id="category-suggestions">
                {[...new Set([...CATEGORY_SUGGESTIONS, ...categories])].map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-xs text-gray-400 mt-1">Existing: {categories.join(', ') || '—'}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 w-fit">
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" />
            <span className="text-lg">{form.icon || '🏷️'}</span>
            <span className="text-sm font-medium text-gray-800">{form.name || 'Topic name'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              {saved ? <><CheckCircle size={14} /> Saved!</> : saving ? 'Saving…' : 'Save topic'}
            </button>
            <button onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Topics list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No topics yet. Add your first one above.</div>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</h3>
              <div className="space-y-2">
                {topics.filter(t => t.category === cat).map(topic => (
                  <div key={topic.id}
                    className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${
                      editId === topic.id ? 'border-brand-400' : 'border-gray-200'
                    }`}
                  >
                    <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                    <span className="text-base w-6 text-center">{topic.icon}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{topic.name}</span>
                    <span className="text-xs text-gray-400 hidden sm:block">order: {topic.sort_order}</span>

                    {deleteId === topic.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          onClick={() => handleDelete(topic.id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                        >Yes</button>
                        <button
                          onClick={() => { setDeleteId(null); setError('') }}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                        >No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(topic)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteId(topic.id); setError('') }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {topics.length} topic{topics.length !== 1 ? 's' : ''} across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}.
        Changes are immediately visible to attendees.
      </p>
    </div>
  )
}
