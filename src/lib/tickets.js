import { supabase } from './supabase'

// All the actions that earn prize draw tickets
export const TICKET_ACTIONS = {
  PROFILE_COMPLETE:   { action: 'profile_complete',   description: 'Completed your profile',         tickets: 3 },
  GDPR_CONSENT:       { action: 'gdpr_consent',        description: 'Accepted privacy policy',        tickets: 1 },
  FIRST_CONNECTION:   { action: 'first_connection',    description: 'Made your first connection',     tickets: 2 },
  CONNECTION:         { action: 'connection',           description: 'Connected with an attendee',    tickets: 1 },
  SESSION_CHECKIN:    { action: 'session_checkin',      description: 'Checked in to a session',       tickets: 1 },
  INTEREST_FLAG:      { action: 'interest_flag',        description: 'Expressed interest in a topic', tickets: 1 },
  WANT_MORE_INFO:     { action: 'want_more_info',       description: 'Requested more info on a topic',tickets: 2 },
  SURVEY_COMPLETE:    { action: 'survey_complete',      description: 'Completed the event survey',    tickets: 3 },
  MEETING_REQUEST:    { action: 'meeting_request',      description: 'Requested a meeting',           tickets: 1 },
}

export async function awardTickets(attendeeId, actionKey) {
  const config = TICKET_ACTIONS[actionKey]
  if (!config) return

  // Award the specified number of tickets
  const rows = Array.from({ length: config.tickets }, () => ({
    attendee_id: attendeeId,
    action: config.action,
    description: config.description,
  }))

  const { error } = await supabase.from('draw_tickets').insert(rows)
  if (error) console.error('Error awarding tickets:', error)
  return !error
}

export async function hasEarnedTicket(attendeeId, action) {
  const { data } = await supabase
    .from('draw_tickets')
    .select('id')
    .eq('attendee_id', attendeeId)
    .eq('action', action)
    .limit(1)
  return data && data.length > 0
}

export async function getTicketCount(attendeeId) {
  const { count } = await supabase
    .from('draw_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('attendee_id', attendeeId)
  return count || 0
}
