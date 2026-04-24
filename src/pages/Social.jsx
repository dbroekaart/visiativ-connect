import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Twitter, Linkedin, Share2, ExternalLink } from 'lucide-react'

// X (Twitter) icon as SVG since lucide uses old Twitter bird
function XIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default function Social() {
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const twitterRef = useRef(null)
  const widgetLoaded = useRef(false)

  const DEFAULT_HASHTAG = '#Visiativmycadday2026'

  useEffect(() => {
    supabase
      .from('events')
      .select('social_hashtag, name')
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        setEvent(data)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || widgetLoaded.current) return
    loadTwitterWidget()
  }, [loading])

  function loadTwitterWidget() {
    const hashtag = (event?.social_hashtag || DEFAULT_HASHTAG).replace(/^#/, '')
    widgetLoaded.current = true

    // Load Twitter widget script
    if (!window.twttr) {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'
      script.onload = () => renderWidget(hashtag)
      document.head.appendChild(script)
    } else {
      renderWidget(hashtag)
    }
  }

  function renderWidget(hashtag) {
    if (!twitterRef.current || !window.twttr) return
    twitterRef.current.innerHTML = ''
    window.twttr.widgets.createTimeline(
      {
        sourceType: 'url',
        url: `https://twitter.com/hashtag/${hashtag}?src=hashtag_click`,
      },
      twitterRef.current,
      {
        height: 480,
        theme: 'light',
        lang: 'en',
        chrome: 'noheader nofooter noborders',
      }
    )
  }

  const hashtag = event?.social_hashtag || DEFAULT_HASHTAG
  const hashtagClean = hashtag.replace(/^#/, '')
  const eventName = event?.name || 'Visiativ Customer Day 2026'

  const shareTextX = encodeURIComponent(`Just connected at ${eventName}! ${hashtag}`)
  const shareUrlX = `https://twitter.com/intent/tweet?text=${shareTextX}`

  const shareTextLinkedIn = encodeURIComponent(`I'm attending ${eventName}! Join the conversation: ${hashtag}`)
  const shareUrlLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://dbroekaart.github.io/visiativ-connect/')}&summary=${shareTextLinkedIn}`

  return (
    <Layout title="Social Feed" back={() => navigate(-1)}>
      <div className="p-4 space-y-4">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Event hashtag</p>
          <h2 className="text-2xl font-bold mb-1">{hashtag}</h2>
          <p className="text-slate-400 text-sm">Share your experience and connect with others!</p>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={shareUrlX}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-black text-white font-semibold py-3.5 rounded-2xl hover:bg-gray-900 transition-colors"
          >
            <XIcon size={16} />
            Post on X
          </a>
          <a
            href={shareUrlLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#0A66C2] text-white font-semibold py-3.5 rounded-2xl hover:bg-[#0958A8] transition-colors"
          >
            <Linkedin size={16} />
            Share on LinkedIn
          </a>
        </div>

        {/* Browse hashtag link */}
        <a
          href={`https://twitter.com/hashtag/${hashtagClean}?src=hashtag_click`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 hover:border-brand-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <XIcon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Browse #{hashtagClean}</p>
              <p className="text-xs text-gray-400">See all posts on X/Twitter</p>
            </div>
          </div>
          <ExternalLink size={16} className="text-gray-400" />
        </a>

        {/* Live X timeline embed */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <XIcon size={14} className="text-gray-600" />
            <p className="text-sm font-semibold text-gray-700">Live posts · #{hashtagClean}</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
            </div>
          ) : (
            <div ref={twitterRef} className="min-h-48">
              {/* Twitter widget renders here */}
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
                <XIcon size={28} className="text-gray-300" />
                <p className="text-sm text-gray-400">Loading posts…</p>
                <p className="text-xs text-gray-300">Make sure you have internet access</p>
              </div>
            </div>
          )}
        </div>

        {/* LinkedIn note */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <Linkedin size={18} className="text-[#0A66C2] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">LinkedIn</p>
            <p className="text-xs text-gray-500">LinkedIn doesn't support public hashtag feeds in embedded views. Use the "Share on LinkedIn" button above to post about the event!</p>
          </div>
        </div>

      </div>
    </Layout>
  )
}
