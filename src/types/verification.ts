// ─── Command Center types ─────────────────────────

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
