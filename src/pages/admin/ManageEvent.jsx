import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle } from 'lucide-react'

export default function ManageEvent() {
  const [event, setEvent]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [form, setForm]     = useState({
    name: '', date: '', end_date: '', location: '', description: '', prize_description: '', is_active: true,
    wifi_network: '', wifi_password: '', parking_info: '', floor_plan_url: '', social_hashtag: '#Visiativmycadday2026',
  })

  useEffect(() => { loadEvent() }, [])

  async function loadEvent() {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(1).single()
    if (data) {
      setEvent(data)
      setForm({
        name: data.name || '',
        date: data.date || '',
        end_date: data.end_date || '',
        location: data.location || '',
        description: data.description || '',
        prize_description: data.prize_description || '',
        is_active: data.is_active,
        wifi_network: data.wifi_network || '',
        wifi_password: data.wifi_password || '',
        parking_info: data.parking_info || '',
        floor_plan_url: data.floor_plan_url || '',
        social_hashtag: data.social_hashtag || '#Visiativmycadday2026',
      })
    }
  }

  function update(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleSave() {
    setSaving(true)
    if (event) {
      await supabase.from('events').update(form).eq('id', event.id)
    } else {
      await supabase.from('events').insert(form)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    await loadEvent()
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{event ? 'Event Settings' : 'Create Event'}</h2>
        <p className="text-sm text-gray-500 mt-1">Configure the active event that attendees see in the app.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event name *</label>
          <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Visiativ Customer Day 2025" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.date} onChange={e => update('date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.end_date} onChange={e => update('end_date', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Lyon Convention Centre" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event description</label>
          <textarea rows={2} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            value={form.description} onChange={e => update('description', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🏆 Prize description</label>
          <p className="text-xs text-gray-400 mb-1.5">First line = prize name (bold). Add a line break for extra details.</p>
          <textarea rows={3} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder={"Weekend Spa Ardennes\nWin een luxe spa-weekend voor twee personen, ter waarde van €500. De winnaar wordt bekendgemaakt tijdens het slotprogramma."}
            value={form.prize_description} onChange={e => update('prize_description', e.target.value)} />
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-brand-600" />
            <span className="text-sm font-medium text-gray-700">Active (visible to attendees)</span>
          </label>
        </div>
      </div>

      {/* Venue info section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Venue & Practical Info</h3>
        <p className="text-sm text-gray-500 mb-3">Shown on the Venue page in the app.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📶 WiFi Network</label>
            <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.wifi_network} onChange={e => update('wifi_network', e.target.value)} placeholder="e.g. VisiativGuest" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🔑 WiFi Password</label>
            <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.wifi_password} onChange={e => update('wifi_password', e.target.value)} placeholder="e.g. Welcome2025!" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🚗 Parking Information</label>
          <textarea rows={3} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            value={form.parking_info} onChange={e => update('parking_info', e.target.value)}
            placeholder="e.g. Free parking available in the P2 car park on Rue des Artisans. Enter via the north gate." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🗺️ Floor Plan URL</label>
          <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.floor_plan_url} onChange={e => update('floor_plan_url', e.target.value)} placeholder="https://... (link to image or PDF)" />
          <p className="text-xs text-gray-400 mt-1">Upload the floor plan image to a file host (e.g. Supabase Storage, Imgur) and paste the link here.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📣 Social Hashtag</label>
          <input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={form.social_hashtag} onChange={e => update('social_hashtag', e.target.value)} placeholder="#Visiativmycadday2026" />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || !form.name}
        className={`w-full font-semibold py-3 rounded-2xl transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white'}`}>
        {saved ? <span className="flex items-center justify-center gap-2"><CheckCircle size={18} /> Saved!</span>
          : saving ? 'Saving…' : event ? 'Save changes' : 'Create event'}
      </button>
    </div>
  )
}
