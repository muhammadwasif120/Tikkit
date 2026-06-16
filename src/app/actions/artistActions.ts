'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

async function getManagementAccount(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await (supabase as any)
    .from('management_accounts')
    .select('id, company_name, account_status')
    .eq('user_id', userId)
    .single()
  return data as { id: string; company_name: string; account_status: string } | null
}

// ── Verified organiser check ──────────────────────────────────────────────────

export async function getVerificationStatus(userId: string) {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('verifications')
    .select('status, tier, verified_at')
    .eq('entity_id', userId)
    .eq('entity_type', 'organizer')
    .maybeSingle()
  return data as { status: string; tier: number; verified_at: string } | null
}

// ── Booking enquiries ─────────────────────────────────────────────────────────

export async function submitEnquiry(artistId: string, managementId: string, fd: FormData) {
  const { supabase, user } = await getAuthUser()

  // Gate: must be a verified organiser
  const { data: verification } = await (supabase as any)
    .from('verifications')
    .select('status')
    .eq('entity_id', user.id)
    .eq('entity_type', 'organizer')
    .maybeSingle()

  if (!verification || verification.status !== 'verified') {
    return { error: 'You must be a Verified Organiser to submit a booking enquiry.' }
  }

  const { error } = await (supabase as any)
    .from('artist_enquiries')
    .insert({
      artist_id:            artistId,
      management_id:        managementId,
      organiser_id:         user.id,
      event_name:           (fd.get('event_name') as string).trim(),
      event_type:           fd.get('event_type') as string,
      event_date:           fd.get('event_date') as string,
      event_city:           (fd.get('event_city') as string).trim(),
      event_venue:          (fd.get('event_venue') as string)?.trim() || null,
      estimated_attendance: fd.get('estimated_attendance') as string,
      performance_duration: fd.get('performance_duration') as string,
      set_type:             (fd.get('set_type') as string) || null,
      additional_notes:     (fd.get('additional_notes') as string)?.trim() || null,
    })

  return { error: error?.message ?? null }
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: string,
  declineReason?: string
) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const patch: Record<string, any> = { status }
  if (status === 'booked')    patch.booked_at    = new Date().toISOString()
  if (status === 'responded') patch.responded_at = new Date().toISOString()
  if (status === 'declined') {
    patch.declined_at    = new Date().toISOString()
    patch.decline_reason = declineReason ?? null
  }

  const { error } = await (supabase as any)
    .from('artist_enquiries')
    .update(patch)
    .eq('id', enquiryId)
    .eq('management_id', mgmt.id)

  revalidatePath('/artist-mgmt/os/enquiries')
  return { error: error?.message ?? null }
}

export async function markEnquiryViewed(enquiryId: string) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  await (supabase as any)
    .from('artist_enquiries')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', enquiryId)
    .eq('management_id', mgmt.id)
    .is('viewed_at', null)

  return { error: null }
}

// ── Artist self-service fields ────────────────────────────────────────────────

export async function updateArtistSelfService(artistId: string, fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const eventTypes = fd.getAll('event_types_accepted') as string[]

  const { error } = await (supabase as any)
    .from('artists')
    .update({
      bio:                  (fd.get('bio') as string)?.trim() || null,
      availability_status:  fd.get('availability_status') as string,
      event_types_accepted: eventTypes.length > 0 ? eventTypes : ['concert'],
      media_links: {
        youtube:    (fd.get('youtube') as string)?.trim()    || null,
        soundcloud: (fd.get('soundcloud') as string)?.trim() || null,
        spotify:    (fd.get('spotify') as string)?.trim()    || null,
      },
      social_links: {
        instagram: (fd.get('instagram') as string)?.trim() || null,
        facebook:  (fd.get('facebook') as string)?.trim()  || null,
        youtube:   (fd.get('social_youtube') as string)?.trim() || null,
      },
    })
    .eq('id', artistId)
    .eq('management_id', mgmt.id)

  revalidatePath(`/artist-mgmt/os/roster/${artistId}`)
  return { error: error?.message ?? null }
}

// ── Past events ───────────────────────────────────────────────────────────────

export async function addPastEvent(artistId: string, fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  // Verify this artist belongs to this management
  const { data: artist } = await (supabase as any)
    .from('artists')
    .select('id')
    .eq('id', artistId)
    .eq('management_id', mgmt.id)
    .maybeSingle()

  if (!artist) return { error: 'Artist not found' }

  const { error } = await (supabase as any)
    .from('artist_past_events')
    .insert({
      artist_id:  artistId,
      event_name: (fd.get('event_name') as string).trim(),
      event_date: fd.get('event_date') as string,
      venue_name: (fd.get('venue_name') as string)?.trim() || null,
      city:       (fd.get('city') as string).trim(),
    })

  revalidatePath(`/artists/${artistId}`)
  return { error: error?.message ?? null }
}

export async function deletePastEvent(eventId: string) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const { error } = await (supabase as any)
    .from('artist_past_events')
    .delete()
    .eq('id', eventId)
    .in('artist_id', (supabase as any)
      .from('artists').select('id').eq('management_id', mgmt.id))

  revalidatePath('/artist-mgmt/os')
  return { error: error?.message ?? null }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function markNotificationsRead(managementId: string) {
  const { supabase } = await getAuthUser()
  await (supabase as any)
    .from('management_notifications')
    .update({ read: true })
    .eq('management_id', managementId)
    .eq('read', false)
  revalidatePath('/artist-mgmt/os')
  return { error: null }
}

// ── Artist creation (draft — Tikkit X publishes) ──────────────────────────────

export async function createArtist(fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const name = (fd.get('name') as string).trim()
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data: artist, error } = await (supabase as any)
    .from('artists')
    .insert({
      management_id:   mgmt.id,
      name,
      slug,
      category:        fd.get('category') as string,
      sub_tags:        (fd.get('sub_tags') as string).split(',').map((t: string) => t.trim()).filter(Boolean),
      based_in_city:   (fd.get('based_in_city') as string)?.trim() || null,
      availability_status: 'not_accepting',
      profile_status:  'draft',
      verified:        false,
    })
    .select('id, slug')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/artist-mgmt/os')
  return { error: null, artistId: artist.id, slug: artist.slug }
}

// ── Storage uploads ───────────────────────────────────────────────────────────

export async function uploadArtistPhoto(artistId: string, fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const file = fd.get('file') as File
  if (!file || file.size === 0) return { error: 'No file provided' }
  if (file.size > 10 * 1024 * 1024) return { error: 'File too large (max 10 MB)' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${artistId}/profile.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('artist-photos')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('artist-photos')
    .getPublicUrl(path)

  const { error: dbError } = await (supabase as any)
    .from('artists')
    .update({ profile_photo_url: publicUrl })
    .eq('id', artistId)
    .eq('management_id', mgmt.id)

  revalidatePath(`/artists`)
  return { error: dbError?.message ?? null, url: publicUrl }
}

export async function uploadGalleryImage(artistId: string, fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const file = fd.get('file') as File
  if (!file || file.size === 0) return { error: 'No file provided' }
  if (file.size > 10 * 1024 * 1024) return { error: 'File too large (max 10 MB)' }

  const ext   = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path  = `${artistId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('artist-gallery')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('artist-gallery')
    .getPublicUrl(path)

  // Append to gallery_urls array
  const { data: artist } = await (supabase as any)
    .from('artists').select('gallery_urls').eq('id', artistId).single()
  const existing = artist?.gallery_urls ?? []

  const { error: dbError } = await (supabase as any)
    .from('artists')
    .update({ gallery_urls: [...existing, publicUrl] })
    .eq('id', artistId)
    .eq('management_id', mgmt.id)

  revalidatePath(`/artists`)
  return { error: dbError?.message ?? null, url: publicUrl }
}

export async function removeGalleryImage(artistId: string, imageUrl: string) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const { data: artist } = await (supabase as any)
    .from('artists').select('gallery_urls').eq('id', artistId).eq('management_id', mgmt.id).single()
  if (!artist) return { error: 'Artist not found' }

  const updated = (artist.gallery_urls ?? []).filter((u: string) => u !== imageUrl)
  const { error } = await (supabase as any)
    .from('artists').update({ gallery_urls: updated }).eq('id', artistId).eq('management_id', mgmt.id)

  revalidatePath(`/artists`)
  return { error: error?.message ?? null }
}

export async function uploadPressKit(artistId: string, fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const file = fd.get('file') as File
  if (!file || file.size === 0) return { error: 'No file provided' }
  if (file.size > 20 * 1024 * 1024) return { error: 'File too large (max 20 MB)' }
  if (file.type !== 'application/pdf') return { error: 'Only PDF files accepted' }

  const path   = `${artistId}/press-kit.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('artist-press-kit')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) return { error: uploadError.message }

  // Press kit bucket is private — store the path, generate signed URL on demand
  const { error: dbError } = await (supabase as any)
    .from('artists')
    .update({ press_kit_url: path })
    .eq('id', artistId)
    .eq('management_id', mgmt.id)

  return { error: dbError?.message ?? null, path }
}

export async function getPressKitSignedUrl(artistId: string) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found', url: null }

  const { data: artist } = await (supabase as any)
    .from('artists').select('press_kit_url').eq('id', artistId).eq('management_id', mgmt.id).single()
  if (!artist?.press_kit_url) return { error: 'No press kit uploaded', url: null }

  const { data, error } = await supabase.storage
    .from('artist-press-kit')
    .createSignedUrl(artist.press_kit_url, 3600) // 1 hour

  return { error: error?.message ?? null, url: data?.signedUrl ?? null }
}

// ── Management account settings ───────────────────────────────────────────────

export async function updateManagementSettings(fd: FormData) {
  const { supabase, user } = await getAuthUser()
  const mgmt = await getManagementAccount(supabase, user.id)
  if (!mgmt) return { error: 'Management account not found' }

  const { error } = await (supabase as any)
    .from('management_accounts')
    .update({
      company_name:  (fd.get('company_name') as string)?.trim() || mgmt.company_name,
      contact_email: (fd.get('contact_email') as string)?.trim() || null,
      contact_phone: (fd.get('contact_phone') as string)?.trim() || null,
      website:       (fd.get('website') as string)?.trim()       || null,
    })
    .eq('id', mgmt.id)

  revalidatePath('/artist-mgmt/os/settings')
  return { error: error?.message ?? null }
}
