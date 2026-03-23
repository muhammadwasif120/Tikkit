export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          balance_after: number
          created_at: string | null
          event_id: string | null
          guest_id: string
          guest_record_id: string | null
          id: string
          note: string | null
          points: number
          type: string
        }
        Insert: {
          balance_after: number
          created_at?: string | null
          event_id?: string | null
          guest_id: string
          guest_record_id?: string | null
          id?: string
          note?: string | null
          points: number
          type: string
        }
        Update: {
          balance_after?: number
          created_at?: string | null
          event_id?: string | null
          guest_id?: string
          guest_record_id?: string | null
          id?: string
          note?: string | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_guest_record_id_fkey"
            columns: ["guest_record_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          uses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      event_chats: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string
          recipient_user_id: string | null
          role: string
          screenshot_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message: string
          recipient_user_id?: string | null
          role?: string
          screenshot_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string
          recipient_user_id?: string | null
          role?: string
          screenshot_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_chats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ledger: {
        Row: {
          amount: number | null
          currency: string | null
          event_id: string
          id: string
          ledger_type: string
          metadata: Json
          recorded_at: string
          ref_id: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          event_id: string
          id?: string
          ledger_type: string
          metadata?: Json
          recorded_at?: string
          ref_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          currency?: string | null
          event_id?: string
          id?: string
          ledger_type?: string
          metadata?: Json
          recorded_at?: string
          ref_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_passes: {
        Row: {
          cover_image_url: string | null
          event_date: string
          event_id: string
          event_title: string
          guest_id: string
          guest_record_id: string | null
          id: string
          issued_at: string | null
          pass_number: number | null
          serial: string | null
          ticket_price_paid: number | null
          venue_name: string | null
          was_vip: boolean
        }
        Insert: {
          cover_image_url?: string | null
          event_date: string
          event_id: string
          event_title: string
          guest_id: string
          guest_record_id?: string | null
          id?: string
          issued_at?: string | null
          pass_number?: number | null
          serial?: string | null
          ticket_price_paid?: number | null
          venue_name?: string | null
          was_vip?: boolean
        }
        Update: {
          cover_image_url?: string | null
          event_date?: string
          event_id?: string
          event_title?: string
          guest_id?: string
          guest_record_id?: string | null
          id?: string
          issued_at?: string | null
          pass_number?: number | null
          serial?: string | null
          ticket_price_paid?: number | null
          venue_name?: string | null
          was_vip?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_passes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_passes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_passes_guest_record_id_fkey"
            columns: ["guest_record_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payment_accounts: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          payment_account_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          payment_account_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          payment_account_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_payment_accounts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_payment_accounts_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          budget: number | null
          capacity: number
          category_id: string | null
          cover_image_url: string | null
          created_at: string | null
          date_end: string | null
          date_start: string
          description: string | null
          female_ratio: number | null
          female_ratio_max: number | null
          id: string
          is_private: boolean | null
          is_public: boolean | null
          male_ratio: number | null
          male_ratio_max: number | null
          organizer_id: string
          reference_code: string | null
          registration_mode: string | null
          require_id_verification: boolean | null
          require_reference_code: boolean | null
          secret_venue: boolean | null
          slug: string | null
          status: string
          tags: string[] | null
          ticket_price: number | null
          title: string
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
          venue_reveal_at: string | null
          venue_secret: boolean | null
        }
        Insert: {
          budget?: number | null
          capacity?: number
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          date_end?: string | null
          date_start: string
          description?: string | null
          female_ratio?: number | null
          female_ratio_max?: number | null
          id?: string
          is_private?: boolean | null
          is_public?: boolean | null
          male_ratio?: number | null
          male_ratio_max?: number | null
          organizer_id: string
          reference_code?: string | null
          registration_mode?: string | null
          require_id_verification?: boolean | null
          require_reference_code?: boolean | null
          secret_venue?: boolean | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          ticket_price?: number | null
          title: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
          venue_reveal_at?: string | null
          venue_secret?: boolean | null
        }
        Update: {
          budget?: number | null
          capacity?: number
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string
          description?: string | null
          female_ratio?: number | null
          female_ratio_max?: number | null
          id?: string
          is_private?: boolean | null
          is_public?: boolean | null
          male_ratio?: number | null
          male_ratio_max?: number | null
          organizer_id?: string
          reference_code?: string | null
          registration_mode?: string | null
          require_id_verification?: boolean | null
          require_reference_code?: boolean | null
          secret_venue?: boolean | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          ticket_price?: number | null
          title?: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
          venue_reveal_at?: string | null
          venue_secret?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_profiles: {
        Row: {
          attendance_streak: number
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          credit_score: number
          id: string
          instagram_handle: string | null
          is_discoverable: boolean | null
          longest_streak: number
          profile_public: boolean
          total_attended: number
          total_no_shows: number
          total_vip_events: number
          updated_at: string | null
          username: string | null
        }
        Insert: {
          attendance_streak?: number
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          credit_score?: number
          id: string
          instagram_handle?: string | null
          is_discoverable?: boolean | null
          longest_streak?: number
          profile_public?: boolean
          total_attended?: number
          total_no_shows?: number
          total_vip_events?: number
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          attendance_streak?: number
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          credit_score?: number
          id?: string
          instagram_handle?: string | null
          is_discoverable?: boolean | null
          longest_streak?: number
          profile_public?: boolean
          total_attended?: number
          total_no_shows?: number
          total_vip_events?: number
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string | null
          discount_amount: number | null
          discount_applied: boolean | null
          email: string | null
          event_id: string
          full_name: string
          gender: string | null
          guest_profile_id: string | null
          id: string
          invited_at: string | null
          is_vip: boolean | null
          phone: string | null
          plus_one: boolean | null
          plus_one_name: string | null
          qr_code: string
          qr_token: string | null
          qr_token_generated_at: string | null
          status: string
          ticket_days: string[] | null
          ticket_price_paid: number | null
          ticket_type_id: string | null
          waitlist: boolean | null
          waitlist_position: number | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_applied?: boolean | null
          email?: string | null
          event_id: string
          full_name: string
          gender?: string | null
          guest_profile_id?: string | null
          id?: string
          invited_at?: string | null
          is_vip?: boolean | null
          phone?: string | null
          plus_one?: boolean | null
          plus_one_name?: string | null
          qr_code?: string
          qr_token?: string | null
          qr_token_generated_at?: string | null
          status?: string
          ticket_days?: string[] | null
          ticket_price_paid?: number | null
          ticket_type_id?: string | null
          waitlist?: boolean | null
          waitlist_position?: number | null
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_applied?: boolean | null
          email?: string | null
          event_id?: string
          full_name?: string
          gender?: string | null
          guest_profile_id?: string | null
          id?: string
          invited_at?: string | null
          is_vip?: boolean | null
          phone?: string | null
          plus_one?: boolean | null
          plus_one_name?: string | null
          qr_code?: string
          qr_token?: string | null
          qr_token_generated_at?: string | null
          status?: string
          ticket_days?: string[] | null
          ticket_price_paid?: number | null
          ticket_type_id?: string | null
          waitlist?: boolean | null
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_guest_profile_id_fkey"
            columns: ["guest_profile_id"]
            isOneToOne: false
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dismissed: boolean
          event_id: string | null
          id: string
          metadata: Json | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dismissed?: boolean
          event_id?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dismissed?: boolean
          event_id?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_checkin_queue: {
        Row: {
          created_at: string | null
          event_id: string | null
          guest_id: string | null
          id: string
          scanned_at: string
          scanner_device: string | null
          synced_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          guest_id?: string | null
          id?: string
          scanned_at: string
          scanner_device?: string | null
          synced_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          guest_id?: string | null
          id?: string
          scanned_at?: string
          scanner_device?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offline_checkin_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_checkin_queue_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_favourites: {
        Row: {
          created_at: string | null
          id: string
          organizer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organizer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organizer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_favourites_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          account_number: string
          account_title: string
          account_type: string
          bank_name: string | null
          created_at: string | null
          iban: string | null
          id: string
          instructions: string | null
          is_active: boolean
          label: string
          organizer_id: string
        }
        Insert: {
          account_number: string
          account_title: string
          account_type?: string
          bank_name?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          label: string
          organizer_id: string
        }
        Update: {
          account_number?: string
          account_title?: string
          account_type?: string
          bank_name?: string | null
          created_at?: string | null
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          label?: string
          organizer_id?: string
        }
        Relationships: []
      }
      payment_submissions: {
        Row: {
          event_id: string
          guest_id: string | null
          id: string
          notes: string | null
          payment_account_id: string | null
          registration_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          event_id: string
          guest_id?: string | null
          id?: string
          notes?: string | null
          payment_account_id?: string | null
          registration_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          event_id?: string
          guest_id?: string | null
          id?: string
          notes?: string | null
          payment_account_id?: string | null
          registration_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_submissions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_submissions_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_submissions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "public_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_waitlist: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: string
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role: string
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_status: string
          avatar_url: string | null
          company_name: string | null
          cover_image_url: string | null
          created_at: string | null
          didit_verification_id: string | null
          email: string
          full_name: string
          id: string
          is_id_verified: boolean
          is_payment_verified: boolean
          logo_url: string | null
          notification_preferences: Json
          payment_method_token: string | null
          phone_number: string | null
          role: string
          social_score: number
          updated_at: string | null
          username: string | null
        }
        Insert: {
          admin_status?: string
          avatar_url?: string | null
          company_name?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          didit_verification_id?: string | null
          email: string
          full_name: string
          id: string
          is_id_verified?: boolean
          is_payment_verified?: boolean
          logo_url?: string | null
          notification_preferences?: Json
          payment_method_token?: string | null
          phone_number?: string | null
          role?: string
          social_score?: number
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          admin_status?: string
          avatar_url?: string | null
          company_name?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          didit_verification_id?: string | null
          email?: string
          full_name?: string
          id?: string
          is_id_verified?: boolean
          is_payment_verified?: boolean
          logo_url?: string | null
          notification_preferences?: Json
          payment_method_token?: string | null
          phone_number?: string | null
          role?: string
          social_score?: number
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_registrations: {
        Row: {
          created_at: string | null
          email: string
          event_id: string
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          payment_screenshot_url: string | null
          payment_status: string | null
          payment_submission_id: string | null
          payment_token: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          ticket_days: string[] | null
        }
        Insert: {
          created_at?: string | null
          email: string
          event_id: string
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          payment_screenshot_url?: string | null
          payment_status?: string | null
          payment_submission_id?: string | null
          payment_token?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          ticket_days?: string[] | null
        }
        Update: {
          created_at?: string | null
          email?: string
          event_id?: string
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          payment_screenshot_url?: string | null
          payment_status?: string | null
          payment_submission_id?: string | null
          payment_token?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          ticket_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "public_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_registrations_payment_submission_id_fkey"
            columns: ["payment_submission_id"]
            isOneToOne: false
            referencedRelation: "payment_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_registrations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          device_info: string | null
          event_id: string
          guest_id: string
          id: string
          is_offline_sync: boolean | null
          scan_type: string
          scanned_at: string | null
          scanned_by: string | null
        }
        Insert: {
          device_info?: string | null
          event_id: string
          guest_id: string
          id?: string
          is_offline_sync?: boolean | null
          scan_type: string
          scanned_at?: string | null
          scanned_by?: string | null
        }
        Update: {
          device_info?: string | null
          event_id?: string
          guest_id?: string
          id?: string
          is_offline_sync?: boolean | null
          scan_type?: string
          scanned_at?: string | null
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          label: string
          organizer_id: string
          revoked: boolean
          role: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          label: string
          organizer_id: string
          revoked?: boolean
          role: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string
          organizer_id?: string
          revoked?: boolean
          role?: string
          token?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          created_at: string | null
          discount_type: string | null
          discount_value: number | null
          event_id: string
          id: string
          is_vip: boolean | null
          name: string
          original_price: number | null
          price: number | null
          quantity: number
          quantity_sold: number | null
        }
        Insert: {
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          event_id: string
          id?: string
          is_vip?: boolean | null
          name: string
          original_price?: number | null
          price?: number | null
          quantity: number
          quantity_sold?: number | null
        }
        Update: {
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          event_id?: string
          id?: string
          is_vip?: boolean | null
          name?: string
          original_price?: number | null
          price?: number | null
          quantity?: number
          quantity_sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behaviour_log: {
        Row: {
          action: string
          category_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          organizer_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          category_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          organizer_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          category_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          organizer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_behaviour_log_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_behaviour_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_behaviour_log_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_category_scores: {
        Row: {
          category_id: string
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          score?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_category_scores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          document_url: string | null
          due_date: string | null
          event_id: string | null
          id: string
          invoice_number: string | null
          paid_at: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          document_url?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          document_url?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          event_ids: string[] | null
          id: string
          name: string
          notes: string | null
          organizer_id: string
        }
        Insert: {
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          event_ids?: string[] | null
          id?: string
          name: string
          notes?: string | null
          organizer_id: string
        }
        Update: {
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          event_ids?: string[] | null
          id?: string
          name?: string
          notes?: string | null
          organizer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_sessions: {
        Row: {
          created_at: string
          didit_session_id: string | null
          id: string
          paypro_order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          didit_session_id?: string | null
          id?: string
          paypro_order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          didit_session_id?: string | null
          id?: string
          paypro_order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          converted_to_guest: boolean | null
          created_at: string | null
          email: string | null
          event_id: string
          full_name: string
          gender: string | null
          id: string
          notified: boolean | null
          notified_at: string | null
          phone: string | null
          position: number
        }
        Insert: {
          converted_to_guest?: boolean | null
          created_at?: string | null
          email?: string | null
          event_id: string
          full_name: string
          gender?: string | null
          id?: string
          notified?: boolean | null
          notified_at?: string | null
          phone?: string | null
          position: number
        }
        Update: {
          converted_to_guest?: boolean | null
          created_at?: string | null
          email?: string | null
          event_id?: string
          full_name?: string
          gender?: string | null
          id?: string
          notified?: boolean | null
          notified_at?: string | null
          phone?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
      get_public_event_guest_counts: {
        Args: { p_event_ids: string[] }
        Returns: {
          event_id: string
          guest_count: number
        }[]
      }
      get_public_organizer_profile: {
        Args: { p_lookup: string }
        Returns: {
          company_name: string
          cover_image_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          logo_url: string
          phone_number: string
          username: string
        }[]
      }
      get_top_organizers: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: {
          company_name: string
          cover_image_url: string
          full_name: string
          id: string
          is_favourite: boolean
          logo_url: string
          upcoming_event_count: number
          username: string
        }[]
      }
      is_event_organizer: { Args: { p_event_id: string }; Returns: boolean }
      is_event_staff: { Args: { p_event_id: string }; Returns: boolean }
      my_email: { Args: never; Returns: string }
      notify_guest_signup:
        | {
            Args: {
              p_event_id: string
              p_event_title: string
              p_guest_name: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_event_id: string
              p_event_title: string
              p_guest_name: string
              p_is_interest?: boolean
            }
            Returns: undefined
          }
      upsert_category_score: {
        Args: { p_category_id: string; p_delta?: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      notification_type:
        | "guest_signup"
        | "guest_cancellation"
        | "entry_scan"
        | "exit_scan"
        | "vendor_payment_due"
        | "event_going_live"
        | "event_ended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_type: [
        "guest_signup",
        "guest_cancellation",
        "entry_scan",
        "exit_scan",
        "vendor_payment_due",
        "event_going_live",
        "event_ended",
      ],
    },
  },
} as const
