import { supabase } from './supabase'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://tikkit.xyz'

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  return res.json()
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventSummary = {
  id: string
  title: string
  description: string | null
  date_start: string
  date_end: string | null
  venue_name: string | null
  venue_city: string | null
  city: string | null
  capacity: number | null
  ticket_price: number | null
  registration_mode: string
  status: string
  cover_image_url: string | null
  organizer_id: string
  profiles: { full_name: string | null; username: string | null; logo_url: string | null } | null
  event_categories: { id: string; name: string; slug: string; icon: string | null; color: string | null } | null
}

export type EventDetail = EventSummary & {
  venue_address: string | null
  venue_maps_url: string | null
  ticket_types: Array<{ id: string; day: number; date: string; ticket_price: number }>
  registered_count: number
  user_registration: { id: string; status: string; payment_status: string | null } | null
  profiles: { full_name: string | null; username: string | null; logo_url: string | null; bio?: string | null } | null
}

export async function getEvents(page = 0, category?: string, search?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  return request<{ events: EventSummary[]; page: number; limit: number }>(
    `/api/mobile/events?${params}`
  )
}

export async function getEvent(id: string) {
  return request<{ event: EventDetail }>(`/api/mobile/events/${id}`)
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function registerForEvent(body: {
  eventId: string
  name: string
  email: string
  phone?: string
  ticketDays?: string[] | null
}) {
  return request<{ registration: Record<string, unknown>; status: string }>(
    '/api/mobile/register',
    { method: 'POST', body: JSON.stringify(body) }
  )
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export type Ticket = {
  id: string
  name: string | null
  email: string
  status: string
  ticket_days: string[] | null
  is_vip: boolean
  qr_token: string | null
  checked_in_at: string | null
  events: {
    id: string
    title: string
    date_start: string
    date_end: string | null
    venue_name: string | null
    venue_city: string | null
    cover_image_url: string | null
    profiles: { full_name: string | null; username: string | null } | null
  } | null
}

export async function getTickets() {
  return request<{ tickets: Ticket[] }>('/api/mobile/tickets')
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export type GuestExtras = {
  bio: string | null
  social_credits: number
  instagram_handle: string | null
  is_discoverable: boolean
  notification_prefs: { registration_updates: boolean; payment_reminders: boolean; event_reminders: boolean }
  attended_count: number
  active_count: number
}

export type FullProfile = {
  id: string
  full_name: string | null
  email: string
  role: string
  avatar_url: string | null
  username: string | null
  phone_number: string | null
  company_name: string | null
  city: string | null
  notification_preferences: Record<string, boolean> | null
}

export type ProfileUpdate = {
  full_name?: string | null
  phone_number?: string | null
  city?: string | null
  username?: string | null
  company_name?: string | null
  notification_preferences?: Record<string, boolean>
  // guest_profiles fields
  bio?: string | null
  instagram_handle?: string | null
  is_discoverable?: boolean
  notification_prefs?: Record<string, boolean>
  avatar_url?: string | null
}

export async function getProfile() {
  return request<{ profile: FullProfile; guest_extras: GuestExtras }>('/api/mobile/profile')
}

export async function updateProfile(body: ProfileUpdate) {
  return request<{ profile: FullProfile; ok: boolean }>('/api/mobile/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

// ─── Credits ─────────────────────────────────────────────────────────────────

export type CreditTransaction = {
  id: string
  points: number
  type: string
  description: string | null
  created_at: string
  events: { title: string } | null
}

export async function getCredits() {
  return request<{ balance: number; tier: string; transactions: CreditTransaction[] }>(
    '/api/mobile/credits'
  )
}

// ─── Favourites ───────────────────────────────────────────────────────────────

export async function getFavourites(type: 'events' | 'organizers') {
  return request<{ favourites: Record<string, unknown>[] }>(
    `/api/mobile/favourites?type=${type}`
  )
}

export async function addFavourite(type: 'event' | 'organizer', id: string) {
  return request<{ favourited: boolean }>('/api/mobile/favourites', {
    method: 'POST',
    body: JSON.stringify({ type, id }),
  })
}

export async function removeFavourite(type: 'event' | 'organizer', id: string) {
  return request<{ favourited: boolean }>(
    `/api/mobile/favourites?type=${type}&id=${id}`,
    { method: 'DELETE' }
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  created_at: string
  read_at: string | null
}

export async function getNotifications(unreadOnly = false) {
  return request<{ notifications: AppNotification[] }>(
    `/api/mobile/notifications?unread=${unreadOnly}`
  )
}

export async function markNotificationsRead() {
  return request<{ ok: boolean }>('/api/mobile/notifications', { method: 'PATCH' })
}

// ─── Push tokens ─────────────────────────────────────────────────────────────

export async function registerPushToken(token: string, platform: 'ios' | 'android' | 'web') {
  return request<{ ok: boolean }>('/api/mobile/push-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  })
}

// ─── Passes ──────────────────────────────────────────────────────────────────

export type EventPass = {
  id: string
  pass_type: string
  qr_token: string | null
  issued_at: string
  metadata: Record<string, unknown>
  event: {
    id: string
    title: string
    date_start: string
    date_end: string | null
    cover_image_url: string | null
    venue_name: string | null
    venue_city: string | null
  } | null
}

export async function getPasses() {
  return request<{ passes: EventPass[]; newPassIds: string[] }>('/api/mobile/passes')
}

// ─── Organizer ───────────────────────────────────────────────────────────────

export type OrganizerEvent = {
  id: string
  title: string
  date_start: string
  date_end: string | null
  status: string
  cover_image_url: string | null
  venue_name: string | null
  venue_city: string | null
  capacity: number | null
  registration_mode: string
  registration_count: number
  event_categories: { name: string; slug: string } | null
}

export type OrganizerStats = {
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  totalGuests: number
  pendingApprovals: number
  checkedInToday: number
}

export async function getOrganizerStats() {
  return request<{ stats: OrganizerStats }>('/api/mobile/organizer/stats')
}

export async function getOrganizerEvents(status?: string) {
  const params = status ? `?status=${status}` : ''
  return request<{ events: OrganizerEvent[] }>(`/api/mobile/organizer/events${params}`)
}

export type CreateEventPayload = {
  title: string
  description?: string
  date_start: string
  date_end?: string
  venue_name?: string
  venue_address?: string
  venue_city?: string
  capacity?: string
  ticket_price?: string
  registration_mode: 'open' | 'expression_of_interest' | 'invite_only'
  category_id?: string
  status: 'draft' | 'published'
}

export async function createEvent(body: CreateEventPayload) {
  return request<{ event: { id: string; title: string; status: string } }>(
    '/api/mobile/organizer/events',
    { method: 'POST', body: JSON.stringify(body) }
  )
}

export async function getOrganizerEvent(id: string) {
  return request<{ event: CreateEventPayload & { id: string; cover_image_url: string | null } }>(
    `/api/mobile/organizer/events/${id}`
  )
}

export async function updateEvent(id: string, body: CreateEventPayload) {
  return request<{ event: { id: string; title: string; status: string } }>(
    `/api/mobile/organizer/events/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  )
}

export type Registration = {
  id: string
  full_name: string
  email: string
  phone: string | null
  status: string
  payment_status: string | null
  created_at: string
  ticket_days: string[] | null
  gender?: string | null
}

export async function getOrganizerRegistrations(eventId: string, status?: string) {
  const params = new URLSearchParams({ eventId })
  if (status) params.set('status', status)
  return request<{ registrations: Registration[] }>(
    `/api/mobile/organizer/registrations?${params}`
  )
}

export async function updateRegistration(registrationId: string, action: 'approve' | 'reject') {
  return request<{ registration: Registration }>('/api/mobile/organizer/registrations', {
    method: 'PATCH',
    body: JSON.stringify({ registrationId, action }),
  })
}

export type ScanResult = {
  valid: boolean
  already_checked_in?: boolean
  guest?: {
    id: string
    name: string
    email: string
    status: string
    is_vip: boolean
    ticket_days: string[] | null
  }
  error?: string
}

export type AnalyticsEvent = {
  id: string
  title: string
  status: string
  date_start: string
  capacity: number | null
  ticket_price: number | null
  guestCount: number
  revenue: number
  checkedIn: number
  fillRate: number | null
}

export type OrganizerAnalytics = {
  events: AnalyticsEvent[]
  totalRevenue: number
  totalGuests: number
  avgFillRate: number
}

export async function getOrganizerAnalytics() {
  return request<{ analytics: OrganizerAnalytics }>('/api/mobile/organizer/analytics')
}

export async function scanQR(token: string, eventId: string, scanType: 'entry' | 'exit' = 'entry') {
  return request<ScanResult>('/api/mobile/organizer/scan', {
    method: 'POST',
    body: JSON.stringify({ token, eventId, scanType }),
  })
}

// ─── Event Detail (rich) ──────────────────────────────────────────────────────

export type OrganizerEventDetail = CreateEventPayload & {
  id: string
  cover_image_url: string | null
  guest_count: number
  checked_in_count: number
  registration_count: number
  pending_approvals: number
}

export async function getOrganizerEventDetail(id: string) {
  return request<{ event: OrganizerEventDetail }>(`/api/mobile/organizer/events/${id}`)
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export type ApprovalRegistration = {
  id: string
  event_id: string
  full_name: string
  email: string
  phone: string | null
  status: string
  payment_status: string | null
  notes: string | null
  payment_screenshot_url: string | null
  id_document_url: string | null
  reference_code_entered: string | null
  created_at: string
  reviewed_at: string | null
}

export type ApprovalEvent = {
  id: string
  title: string
  registration_mode: string
  require_id_verification: boolean
  require_reference_code: boolean
}

export async function getApprovals(filter = 'pending', eventId?: string) {
  const params = new URLSearchParams({ filter })
  if (eventId) params.set('eventId', eventId)
  return request<{ registrations: ApprovalRegistration[]; events: ApprovalEvent[] }>(
    `/api/mobile/organizer/approvals?${params}`
  )
}

export async function submitApprovalAction(registrationId: string, action: 'approve' | 'reject' | 'confirm_payment' | 'reject_payment', notes?: string) {
  return request<{ registration: ApprovalRegistration }>('/api/mobile/organizer/approvals', {
    method: 'POST',
    body: JSON.stringify({ registrationId, action, notes }),
  })
}

// ─── Global Guests ────────────────────────────────────────────────────────────

export type OrgGuest = {
  id: string
  event_id: string
  full_name: string
  email: string | null
  phone: string | null
  gender: string | null
  status: string
  is_vip: boolean
  waitlist: boolean
  waitlist_position: number | null
  plus_one: boolean
  plus_one_name: string | null
  created_at: string
}

export async function getOrganizerGuests(eventId?: string, tier?: string) {
  const params = new URLSearchParams()
  if (eventId) params.set('eventId', eventId)
  if (tier) params.set('tier', tier)
  const qs = params.toString()
  return request<{ guests: OrgGuest[]; events: Array<{ id: string; title: string; status: string }> }>(
    `/api/mobile/organizer/guests${qs ? '?' + qs : ''}`
  )
}

export async function updateOrgGuest(guestId: string, updates: Partial<OrgGuest>) {
  return request<{ guest: OrgGuest }>('/api/mobile/organizer/guests', {
    method: 'PATCH',
    body: JSON.stringify({ guestId, ...updates }),
  })
}

export async function deleteOrgGuest(guestId: string) {
  return request<{ ok: boolean }>(`/api/mobile/organizer/guests?guestId=${guestId}`, { method: 'DELETE' })
}

export async function addGuest(eventId: string, body: {
  full_name: string; email?: string; phone?: string; gender?: string; is_vip?: boolean; waitlist?: boolean
}) {
  return request<{ guest: OrgGuest }>(`/api/mobile/organizer/events/${eventId}/guests`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ─── Command Center ───────────────────────────────────────────────────────────

export type CommandAttendee = {
  id: string
  full_name: string
  email: string
  phone: string | null
  status: string
  payment_status: string | null
  has_payment_screenshot: boolean
  registered_at: string
}

export type CommandMessage = {
  id: string
  user_id: string
  role: string
  message: string
  created_at: string
  sender_name: string
  sender_avatar: string | null
}

export type CommandEvent = {
  id: string
  title: string
  date_start: string
  date_end: string | null
  status: string
  capacity: number | null
}

export async function getCommandCenter(eventId: string) {
  return request<{
    event: CommandEvent
    attendees: CommandAttendee[]
    messages: CommandMessage[]
    stats: { totalAttendees: number; approvedCount: number; pendingCount: number }
  }>(`/api/mobile/organizer/command/${eventId}`)
}

export async function commandUpdateStatus(eventId: string, registrationId: string, action: 'approve' | 'reject' | 'confirm_payment') {
  return request<{ registration: CommandAttendee }>(`/api/mobile/organizer/command/${eventId}`, {
    method: 'POST',
    body: JSON.stringify({ type: 'update_status', registrationId, action }),
  })
}

export async function commandSendMessage(eventId: string, message: string) {
  return request<{ message: CommandMessage }>(`/api/mobile/organizer/command/${eventId}`, {
    method: 'POST',
    body: JSON.stringify({ type: 'send_message', message }),
  })
}

// ─── Messages (Support) ───────────────────────────────────────────────────────

export type SupportMessage = {
  id: string
  message: string
  sender: 'user' | 'admin'
  created_at: string
  user_name: string
}

export async function getSupportMessages() {
  return request<{ messages: SupportMessage[] }>('/api/mobile/organizer/messages')
}

export async function sendSupportMessage(message: string) {
  return request<{ message: SupportMessage }>('/api/mobile/organizer/messages', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export type Vendor = {
  id: string
  organizer_id: string
  name: string
  category: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
}

export type VendorInvoice = {
  id: string
  vendor_id: string
  event_id: string | null
  amount: number
  status: string
  due_date: string | null
  description: string | null
  paid_at: string | null
}

export async function getVendors() {
  return request<{ vendors: Vendor[] }>('/api/mobile/organizer/vendors')
}

export async function createVendor(body: Omit<Vendor, 'id' | 'organizer_id'>) {
  return request<{ vendor: Vendor }>('/api/mobile/organizer/vendors', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateVendor(body: Partial<Vendor> & { id: string }) {
  return request<{ vendor: Vendor }>('/api/mobile/organizer/vendors', { method: 'PATCH', body: JSON.stringify(body) })
}

export async function deleteVendor(id: string) {
  return request<{ ok: boolean }>(`/api/mobile/organizer/vendors?id=${id}`, { method: 'DELETE' })
}

export async function getInvoices() {
  return request<{ invoices: VendorInvoice[] }>('/api/mobile/organizer/invoices')
}

export async function createInvoice(body: Omit<VendorInvoice, 'id' | 'paid_at'>) {
  return request<{ invoice: VendorInvoice }>('/api/mobile/organizer/invoices', { method: 'POST', body: JSON.stringify(body) })
}

export async function updateInvoice(body: Partial<VendorInvoice> & { id: string }) {
  return request<{ invoice: VendorInvoice }>('/api/mobile/organizer/invoices', { method: 'PATCH', body: JSON.stringify(body) })
}

export async function deleteInvoice(id: string) {
  return request<{ ok: boolean }>(`/api/mobile/organizer/invoices?id=${id}`, { method: 'DELETE' })
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function getVerifyStatus() {
  return request<{ status: 'verified' | 'pending' | 'unverified'; cnic_number: string | null }>(
    '/api/mobile/organizer/verify'
  )
}

// ─── My Registrations ─────────────────────────────────────────────────────────

export type MyRegistration = {
  id: string
  status: string
  payment_status: string | null
  payment_screenshot_url: string | null
  registration_notes: string | null
  notes: string | null
  display_status: string
  reference_code_entered: string | null
  created_at: string
  reviewed_at: string | null
  event: {
    id: string
    title: string
    date_start: string
    date_end: string | null
    venue_name: string | null
    city: string | null
    cover_image_url: string | null
    ticket_price: number | null
    registration_mode: string
    status: string
    organizer_id: string
    profiles: { full_name: string | null; username: string | null; logo_url: string | null } | null
  } | null
}

export async function getMyRegistrations() {
  return request<{ registrations: MyRegistration[] }>('/api/mobile/registrations')
}

// ─── Payment Screenshot ───────────────────────────────────────────────────────

export async function submitPaymentScreenshot(registrationId: string, imageUri: string) {
  const token = await getToken()
  const formData = new FormData()
  formData.append('registrationId', registrationId)

  // React Native FormData appends files as { uri, name, type }
  const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
  // React Native FormData accepts { uri, name, type } for file parts but the TS types don't know that
  formData.append('screenshot', { uri: imageUri, name: `screenshot.${ext}`, type: mimeType } as unknown as Blob)

  const res = await fetch(`${API_BASE}/api/mobile/payment`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Do NOT set Content-Type — let fetch set multipart boundary automatically
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  return res.json() as Promise<{ registration: MyRegistration }>
}

// ─── Guest Chat ───────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string
  user_id: string
  role: string
  message: string
  created_at: string
  sender_name: string
  is_mine: boolean
}

export async function getGuestChat(eventId: string) {
  return request<{
    messages: ChatMessage[]
    event: { id: string; title: string; organizer_name: string | null }
    user_id: string
  }>(`/api/mobile/chat/${eventId}`)
}

export async function sendGuestChatMessage(eventId: string, message: string) {
  return request<{ message: ChatMessage }>(`/api/mobile/chat/${eventId}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
