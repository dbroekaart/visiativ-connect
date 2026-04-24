import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [attendee, setAttendee]   = useState(null)
  const [loading, setLoading]     = useState(true)

  async function loadAttendee(userId) {
    if (!userId) { setAttendee(null); return }
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('loadAttendee timeout')), 6000)
      )
      const query = supabase
        .from('attendees')
        .select('*, account_managers(*)')
        .eq('user_id', userId)
        .single()
      const { data } = await Promise.race([query, timeout])
      setAttendee(data || null)
    } catch {
      setAttendee(null)
    }
  }

  useEffect(() => {
    let initialized = false

    // Safety net: never spin forever
    const safetyTimer = setTimeout(() => {
      if (!initialized) { initialized = true; setLoading(false) }
    }, 6000)

    // Use onAuthStateChange only — avoids auth lock contention with getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Full reset on sign-out
          setUser(null)
          setAttendee(null)
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed: update user token but keep attendee data as-is
          // (avoids clearing isAdmin when the hourly token refresh happens)
          setUser(session?.user ?? null)
        } else {
          // INITIAL_SESSION, SIGNED_IN, USER_UPDATED etc: full load
          setUser(session?.user ?? null)
          await loadAttendee(session?.user?.id)
        }
        if (!initialized) {
          initialized = true
          clearTimeout(safetyTimer)
        }
        setLoading(false)
      }
    )

    return () => { subscription.unsubscribe(); clearTimeout(safetyTimer) }
  }, [])

  async function signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://dbroekaart.github.io/visiativ-connect/',
        shouldCreateUser: false, // Only allow pre-registered attendees
      },
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setAttendee(null)
  }

  async function refreshAttendee() {
    if (user) await loadAttendee(user.id)
  }

  const value = {
    user,
    attendee,
    loading,
    isAdmin: attendee?.is_admin || false,
    isVisiativStaff: attendee?.is_visiativ_staff || false,
    signInWithEmail,
    signOut,
    refreshAttendee,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
