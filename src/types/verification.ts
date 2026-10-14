// ─── Verification & Command Center types ─────────────────────────

// Chat message shape (mirrors event_chats table)
export interface ChatMessage {
  id: string
  event_id: string
  user_id: string
  role: 'organizer' | 'guest' | 'staff'
  message: string
  screenshot_url: string | null
  recipient_user_id?: string | null  // null = broadcast; set = private reply to that user
  created_at: string
  // joined
  sender_name?: string
  sender_avatar?: string | null
}

// Ledger record shape
export interface LedgerRecord {
  id: string
  event_id: string
  user_id: string | null
  ref_id: string
  ledger_type: 'chat_purge_record' | 'media_purge_record'
  amount: number | null
  currency: string
  metadata: Record<string, unknown>
  recorded_at: string
}

// Command center attendee card data
export interface CommandAttendee {
  registration_id: string
  user_id: string | null
  full_name: string
  email: string
  phone_number: string | null
  avatar_url: string | null
  status: string
  payment_status: string | null
  payment_screenshot_url: string | null
  is_id_verified: boolean
  is_payment_verified: boolean
  social_score: number
  registered_at: string
}
