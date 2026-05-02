import { useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight, Ticket, Heart, Star, Settings, Pencil, Camera } from 'lucide-react'

export default function MyProfile() {
  const { attendee, loading: authLoading, refreshAttendee, signOut, isAdmin } = useAuth()
  const navigate    = useNavigate()
  const fileInputRef = useRef(null)

  const [editing, setEditing]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm]           = useState({
    name:         attendee?.name || '',
    job_title:    attendee?.job_title || '',
    bio:          attendee?.bio || '',
    linkedin_url: attendee?.linkedin_url || '',
  })

  function update(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleSave() {
    setSaving(true)
    await supabase.from('attendees').update({
      name:         form.name.trim(),
      job_title:    form.job_title.trim(),
      bio:          form.bio.trim(),
      linkedin_url: form.linkedin_url.trim(),
      updated_at:   new Date().toISOString(),
    }).eq('id', attendee.id)
    await refreshAttendee()
    setSaving(false)
    setEditing(false)
  }

  function handlePhotoClick() {
    fileInputRef.current?.click()
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    setUploading(true)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const img = new window.Image()
      img.onload = async () => {
        // Center-crop and resize to 200×200
        const SIZE = 200
        const canvas = document.createElement('canvas')
        canvas.width  = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width  - minDim) / 2
        const sy = (img.height - minDim) / 2
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)

        await supabase
          .from('attendees')
          .update({ photo_url: dataUrl })
          .eq('id', attendee.id)

        await refreshAttendee()
        setUploading(false)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    // reset so the same file can be picked again
    e.target.value = ''
  }

  async function handleSignOut() {
    if (window.confirm('Sign out of Visiativ Connect?')) {
      await signOut()
      navigate('/login')
    }
  }

  if (authLoading) return (
    <Layout title="My Profile">
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    </Layout>
  )
  if (!attendee) return (
    <Layout title="My Profile">
      <div className="p-4 text-center text-gray-400 text-sm py-16">
        Profile not found. Please sign out and sign in again.
      </div>
    </Layout>
  )

  return (
    <Layout title="My Profile">
      <div className="p-4 space-y-3">

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />

        {/* Profile hero card — no overflow-hidden so avatar ring isn't clipped */}
        <div className="bg-white rounded-3xl shadow-card">
          {/* Gradient banner — overflow-hidden only here for the rounded top */}
          <div
            className="h-20 relative rounded-t-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)' }}
          >
            {!editing && (
              <button
                onClick={() => {
                  setForm({ name: attendee.name || '', job_title: attendee.job_title || '', bio: attendee.bio || '', linkedin_url: attendee.linkedin_url || '' })
                  setEditing(true)
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>

          <div className="px-5 pb-5">
            {/* Avatar — overlapping the banner, with photo-upload button */}
            <div className="flex items-end justify-between -mt-10 mb-3">
              <div className="relative">
                {/* White ring around the circular avatar */}
                <div className="ring-4 ring-white rounded-full shadow-md">
                  <Avatar
                    name={attendee.name}
                    photoUrl={uploading ? null : attendee.photo_url}
                    size="xl"
                  />
                </div>

                {/* Camera upload button */}
                <button
                  onClick={handlePhotoClick}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-brand-600 hover:bg-brand-700 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-colors disabled:opacity-60"
                  title="Change photo"
                >
                  {uploading
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera size={12} className="text-white" />
                  }
                </button>
              </div>
            </div>

            {!editing ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{attendee.name}</h2>
                {attendee.job_title && <p className="text-sm text-gray-500 mt-0.5">{attendee.job_title}</p>}
                <p className="text-sm text-gray-400">{attendee.company}</p>
                <p className="text-xs text-gray-300 mt-1">{attendee.email}</p>
                {attendee.bio && (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">{attendee.bio}</p>
                )}
              </>
            ) : (
              <div className="space-y-3 mt-1">
                <input
                  className="input-field"
                  placeholder="Full name"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="Job title"
                  value={form.job_title}
                  onChange={e => update('job_title', e.target.value)}
                />
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Short bio"
                  value={form.bio}
                  onChange={e => update('bio', e.target.value)}
                />
                <input
                  className="input-filed"
                  placeholder="LinkedIn URL"
                  value={form.linkedin_url}
                  onChange={e => update('linkedin_url', e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-brand-600 text-white font-semibold py-3 rounded-xl text-sm disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-gray-50">
          <ProfileLink to="/prizes"    icon={Ticket}   color="amber"  label="My raffle tickets" />
          <ProfileLink to="/interests" icon={Heart}    color="pink"   label="My interests" />
          <ProfileLink to="/survey"    icon={Star}     color="green"  label="Event survey" />
          {isAdmin && (
            <ProfileLink to="/admin"   icon={Settings} color="brand"  label="Admin dashboard" />
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-red-500 bg-white border border-red-100 font-semibold py-3.5 rounded-2xl text-sm shadow-card hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} /> Sign out
        </button>

      </div>
    </Layout>
  )
}

function ProfileLink({ to, icon: Icon, color, label }) {
  const styles = {
    amber: 'bg-amber-100 text-amber-600',
    pink:  'bg-pink-100 text-pink-600',
    green: 'bg-green-100 text-green-600',
    brand: 'bg-brand-100 text-brand-600',
  }
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${styles[color]}`}>
        <Icon size={16} />
      </div>
      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
      <ChevronRight size={15} className="text-gray-300" />
    </Link>
  )
}
