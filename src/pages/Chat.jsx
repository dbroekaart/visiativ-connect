import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { MessageCircle } from 'lucide-react'

export default function Chat() {
  const { attendee } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (attendee?.id) loadConversations()
  }, [attendee?.id])

  async function loadConversations() {
    // Get all messages involving me
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, name, photo_url, company), recipient:recipient_id(id, name, photo_url, company)')
      .or(`sender_id.eq.${attendee.id},recipient_id.eq.${attendee.id}`)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    // Build conversation list (latest message per person)
    const convMap = {}
    data.forEach(msg => {
      const other = msg.sender_id === attendee.id ? msg.recipient : msg.sender
      if (!other?.id) return
      if (!convMap[other.id]) {
        convMap[other.id] = { person: other, lastMessage: msg, unread: 0 }
      }
      if (msg.recipient_id === attendee.id && !msg.is_read) {
        convMap[other.id].unread++
      }
    })

    setConversations(Object.values(convMap))
    setLoading(false)
  }

  return (
    <Layout title="Messages">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 px-6">
          <MessageCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No messages yet</p>
          <p className="text-sm text-gray-400 mt-1">Find an attendee and send them a message to start networking!</p>
          <Link to="/attendees" className="mt-4 inline-block bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
            Browse attendees
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {conversations.map(({ person, lastMessage, unread }) => (
            <Link
              key={person.id}
              to={`/chat/${person.id}`}
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="relative">
                <Avatar name={person.name} photoUrl={person.photo_url} size="md" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-medium text-gray-900 truncate ${unread > 0 ? 'font-semibold' : ''}`}>
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(lastMessage.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className={`text-sm truncate ${unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                  {lastMessage.sender_id === attendee.id ? 'You: ' : ''}{lastMessage.content}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}
