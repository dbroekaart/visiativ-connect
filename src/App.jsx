import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Pages
import Login        from './pages/Login'
import Home         from './pages/Home'
import Agenda       from './pages/Agenda'
import SessionDetail from './pages/SessionDetail'
import Attendees    from './pages/Attendees'
import AttendeeProfile from './pages/AttendeeProfile'
import Networking   from './pages/Networking'
import Chat         from './pages/Chat'
import Conversation from './pages/Conversation'
import MyProfile    from './pages/MyProfile'
import Prizes       from './pages/Prizes'
import Interests    from './pages/Interests'
import Survey       from './pages/Survey'
import ProfileSetup from './pages/ProfileSetup'
import Venue        from './pages/Venue'
import Social       from './pages/Social'

// Admin pages
import AdminLayout       from './pages/admin/AdminLayout'
import AdminDashboard    from './pages/admin/AdminDashboard'
import UploadAttendees   from './pages/admin/UploadAttendees'
import ManageAgenda      from './pages/admin/ManageAgenda'
import Analytics         from './pages/admin/Analytics'
import LeadsExport       from './pages/admin/LeadsExport'
import ManageEvent       from './pages/admin/ManageEvent'
import ManageTopics      from './pages/admin/ManageTopics'
import ManageAdmins      from './pages/admin/ManageAdmins'
import ResetData         from './pages/admin/ResetData'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, attendee, loading, isAdmin } = useAuth()
  const location = useLocation()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  if (attendee && !attendee.profile_complete && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />
  }
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />

      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
      <Route path="/agenda/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
      <Route path="/attendees" element={<ProtectedRoute><Attendees /></ProtectedRoute>} />
      <Route path="/attendees/:id" element={<ProtectedRoute><AttendeeProfile /></ProtectedRoute>} />
      <Route path="/networking" element={<ProtectedRoute><Networking /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
      <Route path="/prizes" element={<ProtectedRoute><Prizes /></ProtectedRoute>} />
      <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
      <Route path="/survey" element={<ProtectedRoute><Survey /></ProtectedRoute>} />
      <Route path="/venue"  element={<ProtectedRoute><Venue /></ProtectedRoute>} />
      <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="upload"    element={<UploadAttendees />} />
        <Route path="agenda"    element={<ManageAgenda />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="leads"     element={<LeadsExport />} />
        <Route path="event"     element={<ManageEvent />} />
        <Route path="topics"    element={<ManageTopics />} />
        <Route path="admins"    element={<ManageAdmins />} />
        <Route path="reset"     element={<ResetData />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
