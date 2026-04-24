import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Wifi, Car, Map, Copy, Check, ExternalLink } from 'lucide-react'

export default function Venue() {
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedWifi, setCopiedWifi] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [floorPlanOpen, setFloorPlanOpen] = useState(false)

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        setEvent(data)
        setLoading(false)
      })
  }, [])

  function copyToClipboard(text, setter) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true)
      setTimeout(() => setter(false), 2000)
    })
  }

  if (loading) return (
    <Layout title="Venue" back={() => navigate(-1)}>
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    </Layout>
  )

  return (
    <Layout title="Venue Info" back={() => navigate(-1)}>
      <div className="p-4 space-y-4">

        {/* Venue header */}
        {event?.location && (
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
            <p className="text-brand-200 text-xs font-medium uppercase tracking-wide mb-1">Event Location</p>
            <h2 className="text-xl font-bold">{event.location}</h2>
            {event.date && (
              <p className="text-brand-200 text-sm mt-1">
                {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* WiFi */}
        {(event?.wifi_network || event?.wifi_password) ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <Wifi size={18} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">WiFi Access</h3>
            </div>
            <div className="space-y-3">
              {event.wifi_network && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Network</p>
                    <p className="font-semibold text-gray-900 text-sm">{event.wifi_network}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(event.wifi_network, setCopiedWifi)}
                    className="text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    {copiedWifi ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              )}
              {event.wifi_password && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Password</p>
                    <p className="font-semibold text-gray-900 text-sm font-mono">{event.wifi_password}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(event.wifi_password, setCopiedPass)}
                    className="text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    {copiedPass ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <Wifi size={18} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">WiFi Access</h3>
            </div>
            <p className="text-sm text-gray-400">WiFi details will be added by the organiser shortly.</p>
          </div>
        )}

        {/* Parking */}
        {event?.parking_info ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Car size={18} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Parking</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{event.parking_info}</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Car size={18} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Parking</h3>
            </div>
            <p className="text-sm text-gray-400">Parking information will be added by the organiser shortly.</p>
          </div>
        )}

        {/* Floor plan */}
        {event?.floor_plan_url ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Map size={18} className="text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Floor Plan</h3>
              </div>
              <a
                href={event.floor_plan_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-600 font-medium"
              >
                Open full <ExternalLink size={12} />
              </a>
            </div>
            <button
              onClick={() => setFloorPlanOpen(!floorPlanOpen)}
              className="w-full"
            >
              {floorPlanOpen ? (
                <img
                  src={event.floor_plan_url}
                  alt="Floor plan"
                  className="w-full rounded-xl border border-gray-100 object-contain max-h-96"
                />
              ) : (
                <div className="w-full h-40 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Map size={32} className="text-gray-300" />
                  <span className="text-sm font-medium">Tap to view floor plan</span>
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                <Map size={18} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Floor Plan</h3>
            </div>
            <p className="text-sm text-gray-400">Floor plan will be uploaded by the organiser shortly.</p>
          </div>
        )}

      </div>
    </Layout>
  )
}
