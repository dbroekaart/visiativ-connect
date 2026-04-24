import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'
import { Upload, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react'

export default function UploadAttendees() {
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const fileRef = useRef()

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setPreview(res.data.slice(0, 5))
      },
    })
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')

    // Get active event
    const { data: ev } = await supabase.from('events').select('id').eq('is_active', true).single()
    if (!ev) {
      setError('No active event found. Please create an event first under "Event" settings.')
      setUploading(false)
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        let imported = 0, skipped = 0, errors = []

        for (const row of res.data) {
          // Expected columns: account_name, contact_name, email, account_manager_name, account_manager_email
          const email = (row.email || row.Email || row['Email Address'] || '').trim().toLowerCase()
          const name  = (row.contact_name || row['Contact Name'] || row.Name || row.name || '').trim()
          const company = (row.account_name || row['Account Name'] || row.Company || row.company || '').trim()
          const amName  = (row.account_manager_name || row['Account Manager Name'] || row['AM Name'] || '').trim()
          const amEmail = (row.account_manager_email || row['Account Manager Email'] || row['AM Email'] || '').trim().toLowerCase()

          if (!email) { skipped++; continue }

          try {
            // Upsert account manager
            let amId = null
            if (amEmail) {
              const { data: am } = await supabase
                .from('account_managers')
                .upsert({ name: amName || amEmail, email: amEmail }, { onConflict: 'email' })
                .select('id')
                .single()
              amId = am?.id
            }

            // Create auth user via admin API if needed — or just create attendee record
            // We pre-create the attendee; auth user is linked when they first log in
            const { error: attErr } = await supabase
              .from('attendees')
              .upsert(
                {
                  email,
                  name,
                  company,
                  event_id: ev.id,
                  account_manager_id: amId,
                  is_admin: false,
                  is_visiativ_staff: false,
                },
                { onConflict: 'email', ignoreDuplicates: false }
              )

            if (attErr) {
              errors.push(`${email}: ${attErr.message}`)
              skipped++
            } else {
              imported++
            }
          } catch (e) {
            errors.push(`${email}: ${e.message}`)
            skipped++
          }
        }

        setResult({ imported, skipped, errors: errors.slice(0, 5), total: res.data.length })
        setUploading(false)
      },
    })
  }

  function downloadTemplate() {
    const csv = `account_name,contact_name,email,account_manager_name,account_manager_email
Acme Engineering,John Smith,john.smith@acme.com,Marie Dupont,m.dupont@visiativ.com
Beta Manufacturing,Anna Müller,a.mueller@beta.de,Pierre Martin,p.martin@visiativ.com`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendees_template.csv'
    a.click()
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Upload Attendees</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV with your registrant list. Each attendee will be able to log in using their email address.
        </p>
      </div>

      {/* Template download */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <FileText size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Required CSV columns</p>
          <p className="text-xs text-blue-700 mt-1">
            <code>account_name</code>, <code>contact_name</code>, <code>email</code>, <code>account_manager_name</code>, <code>account_manager_email</code>
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap"
        >
          <Download size={13} /> Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors"
      >
        <Upload size={32} className="text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">
          {file ? file.name : 'Click to select CSV file'}
        </p>
        <p className="text-xs text-gray-400 mt-1">CSV files only</p>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Preview (first 5 rows)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map(k => (
                    <th key={k} className="px-3 py-2 text-left text-gray-500 font-medium">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700 truncate max-w-32">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload button */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-brand-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-2xl"
        >
          {uploading ? 'Importing attendees…' : 'Import attendees'}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`border rounded-2xl p-4 ${result.errors.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <p className="font-semibold text-gray-900">Import complete</p>
          </div>
          <p className="text-sm text-gray-700">✅ {result.imported} attendees imported</p>
          {result.skipped > 0 && <p className="text-sm text-yellow-700">⚠️ {result.skipped} rows skipped</p>}
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-700 mb-1">Errors (first 5):</p>
              {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Note: Attendees need their user_id linked when they first log in. Existing records are updated if email matches.</p>
        </div>
      )}
    </div>
  )
}
