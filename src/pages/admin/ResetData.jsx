import { useState } from 'react'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const CONFIRM_WORD = 'RESET'

const ALL_ITEMS = [
  { id: 'messages',           label: 'Berichten (chat)',       table: 'messages',            group: 'Gebruikersdata' },
  { id: 'meeting_requests',   label: 'Meeting requests',       table: 'meeting_requests',     group: 'Gebruikersdata' },
  { id: 'connections',        label: 'Connecties',             table: 'connections',          group: 'Gebruikersdata' },
  { id: 'session_attendance', label: 'Sessie-aanwezigheid',    table: 'session_attendance',   group: 'Gebruikersdata' },
  { id: 'attendee_interests', label: 'Interesses',             table: 'attendee_interests',   group: 'Gebruikersdata' },
  { id: 'draw_tickets',       label: 'Raffle tickets',         table: 'draw_tickets',         group: 'Gebruikersdata' },
  { id: 'surveys',            label: 'Surveys',                table: 'surveys',              group: 'Gebruikersdata' },
  { id: 'attendees',          label: 'Deelnemers + inlog-accounts', table: 'attendees',       group: 'Deelnemers', deletesAuth: true },
  { id: 'sessions',           label: 'Sessies (agenda)',       table: 'sessions',             group: 'Agenda' },
  { id: 'events',             label: 'Event & venue-instellingen', table: 'events',           group: 'Event' },
]

const GROUPS = ['Gebruikersdata', 'Deelnemers', 'Agenda', 'Event']

export default function ResetData() {
  const [selected, setSelected] = useState(() => Object.fromEntries(ALL_ITEMS.map(i => [i.id, true])))
  const [showModal, setShowModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [progress, setProgress] = useState([])

  const canConfirm = confirmText === CONFIRM_WORD
  const selectedItems = ALL_ITEMS.filter(i => selected[i.id])
  const noneSelected = selectedItems.length === 0

  function toggleAll(val) {
    setSelected(Object.fromEntries(ALL_ITEMS.map(i => [i.id, val])))
  }

  if (!supabaseAdmin) {
    return (
      <div className="space-y-4 max-w-xl">
        <h2 className="text-xl font-bold text-gray-900">Reset testdata</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex gap-3">
          <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Service role key ontbreekt</p>
            <p>Voeg <code className="bg-yellow-100 px-1 rounded">VITE_SUPABASE_SERVICE_ROLE_KEY</code> toe als GitHub Secret en herstart de deployment.</p>
          </div>
        </div>
      </div>
    )
  }

  function openModal() {
    setShowModal(true)
    setConfirmText('')
    setResult(null)
    setProgress([])
    setErrorMsg('')
  }

  function closeModal() {
    if (loading) return
    setShowModal(false)
    setConfirmText('')
  }

  async function handleReset() {
    if (!canConfirm || loading || noneSelected) return
    setLoading(true)
    setProgress([])
    setResult(null)
    setErrorMsg('')

    const log = []

    try {
      for (const item of selectedItems) {
        const { error } = await supabaseAdmin
          .from(item.table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
        log.push({ label: item.label, ok: !error, msg: error?.message })
        setProgress([...log])
      }

      // Delete auth users only if attendees is selected
      const deleteAuth = selectedItems.some(i => i.deletesAuth)
      if (deleteAuth) {
        let page = 1
        let allUsers = []
        while (true) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
          if (error) throw error
          allUsers = allUsers.concat(data.users)
          if (data.users.length < 1000) break
          page++
        }
        let authOk = true
        let authErr = null
        for (const user of allUsers) {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
          if (error) { authOk = false; authErr = error.message; break }
        }
        log.push({ label: `Auth-accounts (${allUsers.length})`, ok: authOk, msg: authErr })
        setProgress([...log])
      }

      setResult(log.some(l => !l.ok) ? 'partial' : 'success')
    } catch (err) {
      setErrorMsg(err.message)
      setResult('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reset testdata</h2>
        <p className="text-sm text-gray-500 mt-1">
          Selecteer wat je wilt verwijderen. Gebruik dit na een testrun, voor de go-live.
        </p>
      </div>

      {/* Selection card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Te verwijderen data</span>
          <div className="flex gap-2">
            <button onClick={() => toggleAll(true)} className="text-xs text-brand-600 hover:underline font-medium">Alles</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => toggleAll(false)} className="text-xs text-gray-400 hover:underline font-medium">Niets</button>
          </div>
        </div>

        {GROUPS.map(group => {
          const items = ALL_ITEMS.filter(i => i.group === group)
          return (
            <div key={group} className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{group}</p>
              {items.map(item => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selected[item.id]}
                    onChange={e => setSelected(s => ({ ...s, [item.id]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                  />
                  <span className={`text-sm ${selected[item.id] ? 'text-gray-800' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  {item.deletesAuth && selected[item.id] && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">incl. inlog-accounts</span>
                  )}
                </label>
              ))}
            </div>
          )
        })}

        {noneSelected && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            Selecteer minimaal 1 onderdeel om te kunnen resetten.
          </p>
        )}
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-2 text-red-700 text-sm">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <span>De geselecteerde data wordt <strong>permanent</strong> verwijderd — dit kan niet ongedaan worden gemaakt.</span>
      </div>

      {/* Reset button */}
      <button
        onClick={openModal}
        disabled={noneSelected}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:text-red-400 text-white font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
      >
        <Trash2 size={18} />
        Reset geselecteerde data ({selectedItems.length})
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">

            {result === 'success' && (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Reset voltooid</h3>
                <p className="text-sm text-gray-500">De geselecteerde data is verwijderd.</p>
                <ProgressLog items={progress} />
                <button onClick={closeModal} className="mt-2 bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors">Sluiten</button>
              </div>
            )}

            {result === 'partial' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle size={20} />
                  <h3 className="font-bold">Gedeeltelijk gereset</h3>
                </div>
                <ProgressLog items={progress} />
                <button onClick={closeModal} className="w-full bg-gray-100 text-gray-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">Sluiten</button>
              </div>
            )}

            {result === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle size={20} />
                  <h3 className="font-bold">Fout bij resetten</h3>
                </div>
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{errorMsg}</p>
                <button onClick={closeModal} className="w-full bg-gray-100 text-gray-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">Sluiten</button>
              </div>
            )}

            {!result && !loading && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Weet je het zeker?</h3>
                    <p className="text-sm text-gray-500">{selectedItems.length} onderdelen worden permanent verwijderd.</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 space-y-1">
                  {selectedItems.map(i => (
                    <div key={i.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {i.label}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Typ <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600">{CONFIRM_WORD}</span> om te bevestigen
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value.toUpperCase())}
                    placeholder={CONFIRM_WORD}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                    autoFocus
                    autoComplete="off"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors">Annuleren</button>
                  <button
                    onClick={handleReset}
                    disabled={!canConfirm}
                    className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 disabled:bg-red-200 disabled:text-red-400 transition-colors"
                  >
                    Reset uitvoeren
                  </button>
                </div>
              </>
            )}

            {loading && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  <span className="font-semibold text-gray-700">Bezig met resetten…</span>
                </div>
                <ProgressLog items={progress} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProgressLog({ items }) {
  if (!items.length) return null
  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {item.ok ? <span className="text-green-500 font-bold">✓</span> : <span className="text-red-500 font-bold">✗</span>}
          <span className={item.ok ? 'text-gray-700' : 'text-red-700 font-medium'}>{item.label}</span>
          {!item.ok && item.msg && <span className="text-red-400 text-xs truncate ml-auto">{item.msg}</span>}
        </div>
      ))}
    </div>
  )
}
