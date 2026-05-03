import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

const CONFIRM_WORD = 'RESET'

const TABLES_TO_CLEAR = [
  { label: 'Berichten (chat)',        table: 'messages'           },
  { label: 'Meeting requests',        table: 'meeting_requests'   },
  { label: 'Connecties',              table: 'connections'        },
  { label: 'Sessie-aanwezigheid',     table: 'session_attendance' },
  { label: 'Interesses',              table: 'attendee_interests' },
  { label: 'Raffle tickets',          table: 'draw_tickets'       },
  { label: 'Surveys',                 table: 'surveys'            },
  { label: 'Sessies (agenda)',        table: 'sessions'           },
  { label: 'Deelnemers',             table: 'attendees'          },
  { label: 'Events',                  table: 'events'             },
]

export default function ResetData() {
  const [showModal, setShowModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [progress, setProgress] = useState([])

  const canConfirm = confirmText === CONFIRM_WORD

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
    if (!canConfirm || loading) return
    setLoading(true)
    setProgress([])
    setResult(null)
    setErrorMsg('')

    const log = []

    try {
      for (const { label, table } of TABLES_TO_CLEAR) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) {
          log.push({ label, ok: false, msg: error.message })
        } else {
          log.push({ label, ok: true })
        }
        setProgress([...log])
      }

      const { error: rpcErr } = await supabase.rpc('admin_delete_all_auth_users')
      if (rpcErr) {
        log.push({ label: 'Auth-gebruikers', ok: false, msg: rpcErr.message })
      } else {
        log.push({ label: 'Auth-gebruikers', ok: true })
      }
      setProgress([...log])

      const anyFailed = log.some(l => !l.ok)
      setResult(anyFailed ? 'partial' : 'success')
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
          Verwijder alle data uit de database. Gebruik dit na een testrun, voor de go-live.
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={20} />
          <span className="font-semibold">Dit verwijdert alle data — onomkeerbaar</span>
        </div>
        <p className="text-sm text-red-600">De volgende gegevens worden permanent verwijderd:</p>
        <ul className="text-sm text-red-700 space-y-1">
          {TABLES_TO_CLEAR.map(({ label }) => (
            <li key={label} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {label}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
            Auth-gebruikers (alle inlog-accounts)
          </li>
        </ul>
        <p className="text-xs text-red-500 font-medium mt-2">
          Na de reset kun je de echte deelnemers-CSV opnieuw uploaden als eerste stap richting live.
        </p>
      </div>

      <button
        onClick={openModal}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
      >
        <Trash2 size={18} />
        Reset alle data
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">

            {result === 'success' && (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Database gereset</h3>
                <p className="text-sm text-gray-500">
                  Alle testdata is verwijderd. Je kunt nu de echte deelnemers-CSV uploaden.
                </p>
                <button onClick={closeModal} className="mt-2 bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors">
                  Sluiten
                </button>
              </div>
            )}

            {result === 'partial' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle size={20} />
                  <h3 className="font-bold">Gedeeltelijk gereset</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Sommige tabellen konden niet worden geleegd. Controleer de details en voer indien nodig een handmatige reset uit via het Supabase dashboard.
                </p>
                <ProgressLog items={progress} />
                <button onClick={closeModal} className="w-full bg-gray-100 text-gray-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                  Sluiten
                </button>
              </div>
            )}

            {result === 'error' && (
              <div className="space-y-3">
                <h3 className="font-bold text-red-700">Fout bij resetten</h3>
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{errorMsg}</p>
                <button onClick={closeModal} className="w-full bg-gray-100 text-gray-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                  Sluiten
                </button>
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
                    <p className="text-sm text-gray-500">Deze actie kan niet ongedaan worden gemaakt.</p>
                  </div>
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
                  <button onClick={closeModal} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                    Annuleren
                  </button>
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
                  <span className="font-semibold text-gray-700">Bezig met resetten...</span>
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
          {item.ok
            ? <span className="text-green-500 font-bold">checkmark</span>
            : <span className="text-red-500 font-bold">x</span>
          }
          <span className={item.ok ? 'text-gray-700' : 'text-red-700 font-medium'}>{item.label}</span>
          {!item.ok && item.msg && (
            <span className="text-red-400 text-xs truncate ml-auto">{item.msg}</span>
          )}
        </div>
      ))}
    </div>
  )
}
