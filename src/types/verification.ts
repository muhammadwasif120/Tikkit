// ─── Verification & Command Center types ─────────────────────────

export interface VerificationSession {
  id: string
  user_id: string
  didit_session_id: string | null
  status: 'pending' | 'id_complete' | 'fully_verified' | 'failed'
  created_at: string
  updated_at: string
}

export interface VerifiedProfile {
  id: string
  full_name: string | null
  email: string
  is_id_verified: boolean
  is_payment_verified: boolean
  didit_verification_id: string | null
  payment_method_token: string | null
  social_score: number
}

// Didit webhook payload (https://docs.didit.me/webhooks)
export interface DiditWebhookPayload {
  session_id: string
  status: 'approved' | 'declined' | 'review' | 'expired'
  vendor_data: string   // we pass user_id here when creating the session
  created_at: string
  kyc?: {
    document_type?: string
    document_number?: string
    full_name?: string
    date_of_birth?: string
    nationality?: string
  }
  liveness?: {
    score?: number
    passed?: boolean
  }
}

// Didit create-session response
export interface DiditSessionResponse {
  session_id: string
  session_url: string
  expires_at: string
}

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
  ledger_type: 'didit_verification' | 'chat_purge_record' | 'media_purge_record'
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
