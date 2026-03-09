export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
          role: 'organizer' | 'staff' | 'admin' | 'guest'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          avatar_url?: string | null
          role?: 'organizer' | 'staff' | 'admin' | 'guest'
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          email?: string
          avatar_url?: string | null
          role?: 'organizer' | 'staff' | 'admin' | 'guest'
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          title: string
          description: string | null
          venue_name: string | null
          venue_address: string | null
          venue_secret: boolean
          venue_reveal_at: string | null
          date_start: string
          date_end: string | null
          capacity: number
          is_public: boolean
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          cover_image_url: string | null
          tags: string[] | null
          male_ratio_max: number | null
          female_ratio_max: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          title: string
          description?: string | null
          venue_name?: string | null
          venue_address?: string | null
          venue_secret?: boolean
          venue_reveal_at?: string | null
          date_start: string
          date_end?: string | null
          capacity?: number
          is_public?: boolean
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          cover_image_url?: string | null
          tags?: string[] | null
          male_ratio_max?: number | null
          female_ratio_max?: number | null
        }
        Update: {
          title?: string
          description?: string | null
          venue_name?: string | null
          venue_address?: string | null
          venue_secret?: boolean
          venue_reveal_at?: string | null
          date_start?: string
          date_end?: string | null
          capacity?: number
          is_public?: boolean
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          cover_image_url?: string | null
          tags?: string[] | null
          male_ratio_max?: number | null
          female_ratio_max?: number | null
          updated_at?: string
        }
      }
      ticket_types: {
        Row: {
          id: string
          event_id: string
          name: string
          price: number
          quantity: number
          quantity_sold: number
          is_vip: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          price?: number
          quantity: number
          quantity_sold?: number
          is_vip?: boolean
        }
        Update: {
          name?: string
          price?: number
          quantity?: number
          quantity_sold?: number
          is_vip?: boolean
        }
      }
      guests: {
        Row: {
          id: string
          event_id: string
          ticket_type_id: string | null
          full_name: string
          email: string | null
          phone: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          qr_code: string
          status: 'invited' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
          is_vip: boolean
          plus_one: boolean
          plus_one_name: string | null
          waitlist: boolean
          waitlist_position: number | null
          invited_at: string
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          ticket_type_id?: string | null
          full_name: string
          email?: string | null
          phone?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          qr_code?: string
          status?: 'invited' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
          is_vip?: boolean
          plus_one?: boolean
          plus_one_name?: string | null
          waitlist?: boolean
          waitlist_position?: number | null
        }
        Update: {
          full_name?: string
          email?: string | null
          phone?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          status?: 'invited' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
          is_vip?: boolean
          plus_one?: boolean
          plus_one_name?: string | null
          waitlist?: boolean
          waitlist_position?: number | null
          checked_in_at?: string | null
          checked_out_at?: string | null
        }
      }
      scan_logs: {
        Row: {
          id: string
          event_id: string
          guest_id: string
          scanned_by: string | null
          scan_type: 'entry' | 'exit'
          scanned_at: string
          device_info: string | null
          is_offline_sync: boolean
        }
        Insert: {
          id?: string
          event_id: string
          guest_id: string
          scanned_by?: string | null
          scan_type: 'entry' | 'exit'
          scanned_at?: string
          device_info?: string | null
          is_offline_sync?: boolean
        }
        Update: Record<string, never>
      }
      vendors: {
        Row: {
          id: string
          organizer_id: string
          name: string
          category: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          name: string
          category?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          notes?: string | null
        }
        Update: {
          name?: string
          category?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          notes?: string | null
        }
      }
      vendor_invoices: {
        Row: {
          id: string
          event_id: string | null
          vendor_id: string
          invoice_number: string | null
          amount: number
          currency: string
          due_date: string | null
          status: 'pending' | 'paid' | 'overdue' | 'disputed'
          description: string | null
          document_url: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          vendor_id: string
          invoice_number?: string | null
          amount: number
          currency?: string
          due_date?: string | null
          status?: 'pending' | 'paid' | 'overdue' | 'disputed'
          description?: string | null
          document_url?: string | null
          paid_at?: string | null
        }
        Update: {
          invoice_number?: string | null
          amount?: number
          currency?: string
          due_date?: string | null
          status?: 'pending' | 'paid' | 'overdue' | 'disputed'
          description?: string | null
          document_url?: string | null
          paid_at?: string | null
        }
      }
      discount_codes: {
        Row: {
          id: string
          event_id: string
          code: string
          discount_type: 'percent' | 'fixed'
          discount_value: number
          max_uses: number | null
          uses_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          code: string
          discount_type: 'percent' | 'fixed'
          discount_value: number
          max_uses?: number | null
          uses_count?: number
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          code?: string
          discount_type?: 'percent' | 'fixed'
          discount_value?: number
          max_uses?: number | null
          uses_count?: number
          expires_at?: string | null
          is_active?: boolean
        }
      }
      waitlist: {
        Row: {
          id: string
          event_id: string
          full_name: string
          email: string | null
          phone: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          position: number
          notified: boolean
          notified_at: string | null
          converted_to_guest: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          full_name: string
          email?: string | null
          phone?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          position: number
          notified?: boolean
          notified_at?: string | null
          converted_to_guest?: boolean
        }
        Update: {
          notified?: boolean
          notified_at?: string | null
          converted_to_guest?: boolean
        }
      }
      guest_profiles: {
        Row: {
          id: string
          company_name: string | null
          phone: string | null
          bio: string | null
          ratings_given: number
          social_credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name?: string | null
          phone?: string | null
          bio?: string | null
          ratings_given?: number
          social_credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          phone?: string | null
          bio?: string | null
          ratings_given?: number
          social_credits?: number
          updated_at?: string
        }
      }
      public_registrations: {
        Row: {
          id: string
          event_id: string
          email: string
          full_name: string
          phone: string | null
          status: 'pending' | 'approved' | 'rejected' | 'checked_in'
          payment_status: 'not_required' | 'pending' | 'confirmed'
          registration_notes: string | null
          reviewed_at: string | null
          checked_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          email: string
          full_name: string
          phone?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'checked_in'
          payment_status?: 'not_required' | 'pending' | 'confirmed'
          registration_notes?: string | null
          reviewed_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected' | 'checked_in'
          payment_status?: 'not_required' | 'pending' | 'confirmed'
          registration_notes?: string | null
          reviewed_at?: string | null
          checked_in_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}