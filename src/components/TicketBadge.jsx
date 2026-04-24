import { Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTicketCount } from '../lib/tickets'
import { useAuth } from '../contexts/AuthContext'

export default function TicketBadge() {
  const { attendee } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (attendee?.id) {
      getTicketCount(attendee.id).then(setCount)
    }
  }, [attendee?.id])

  return (
    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
      <Ticket size={14} className="text-yellow-600" />
      <span className="text-xs font-semibold text-yellow-700">{count} tickets</span>
    </div>
  )
}
