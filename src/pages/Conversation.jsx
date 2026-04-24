import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import { Send, ArrowLeft } from 'lucide-react'

export default function Conversation() {
  const { id: otherUserId } = useParams() // This is the OTHER attendee's ID
  const navigate = useNavigate()
  const { attendee } = useAuth()
  const [other, setOther]     = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadOther()
    loadMessages()
    markRead()

    // Real-time subscription
    const channel = supabase
      .channel(`chat-${attendee?.id}-${otherUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${attendee?.id}`,
      }, payload => {
        if (payload.new.sender_id === otherUserId) {
          setMessages(prev => [...prev, payload.new])
          supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id)
          scrollToBottom()
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [otherUserId, attendee?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function loadOther() {
    const { data } = await supabase
      .from('attendees')
      .select('id, name, photo_url, company, job_title, is_visiativ_staff')
      .eq('id', otherUserId)
      .single()
    setOther(data)
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${attendee?.id},recipient_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},recipient_id.eq.${attendee?.id})`
      )
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function markRead() {
    if (!attendee?.id) return
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_id', attendee.id)
      .eq('sender_id', otherUserId)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || sending || !attendee?.id) return
    setSending(true)
    const content = text.trim()
    setText('')

    const { data, error } = await supabase.from('messages').insert({
      sender_id:    attendee.id,
      recipient_id: otherUserId,
      content,
    }).select().single()

    if (!error) setMessages(prev => [...prev, data])
    setSending(false)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-brand-600">
          <ArrowLeft size={22} />
        </button>
        {other && (
          <>
            <Avatar name={other.name} photoUrl={other.photo_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{other.name}</p>
              <p className="text-xs text-gray-400 truncate">{other.job_title}{other.job_title && other.company ? ' · ' : ''}{other.company}</p>
            </div>
          </>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-24">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No messages yet. Say hello! 👋</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === attendee?.id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                isMine
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
              }`}>
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMine ? 'text-brand-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2"
      >
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center disabled:bg-gray-300 transition-colors flex-shrink-0"
        >
          <Send size={16} className="text-white" />
        </button>
      </form>
    </div>
  )
}
