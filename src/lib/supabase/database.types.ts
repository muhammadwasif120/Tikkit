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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendee_stats: {
        Row: {
          attended: number
          id: string
          longest_streak: number
          no_shows: number
          score: number
          streak: number
          tier: Database["public"]["Enums"]["score_tier"]
          updated_at: string
          vip_events: number
        }
        Insert: {
          attended?: number
          id: string
          longest_streak?: number
          no_shows?: number
          score?: number
          streak?: number
          tier?: Database["public"]["Enums"]["score_tier"]
          updated_at?: string
          vip_events?: number
        }
        Update: {
          attended?: number
          id?: string
          longest_streak?: number
          no_shows?: number
          score?: number
          streak?: number
          tier?: Database["public"]["Enums"]["score_tier"]
          updated_at?: string
          vip_events?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendee_stats_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_stats_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_bookings: {
        Row: {
          approved_at: string | null
          attendee_id: string
          cancelled_at: string | null
          checked_in_at: string | null
          created_at: string
          id: string
          organizer_id: string
          pass_purchase_id: string | null
          price_due_pkr: number
          price_paid_pkr: number | null
          qr_token: string
          series_id: string
          session_id: string
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          attendee_id: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          id?: string
          organizer_id: string
          pass_purchase_id?: string | null
          price_due_pkr?: number
          price_paid_pkr?: number | null
          qr_token?: string
          series_id: string
          session_id: string
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          attendee_id?: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          id?: string
          organizer_id?: string
          pass_purchase_id?: string | null
          price_due_pkr?: number
          price_paid_pkr?: number | null
          qr_token?: string
          series_id?: string
          session_id?: string
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_pass_purchase_id_fkey"
            columns: ["pass_purchase_id"]
            isOneToOne: false
            referencedRelation: "pass_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "class_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "public_class_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "public_class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_series: {
        Row: {
          admin_status: Database["public"]["Enums"]["admin_status"]
          area_label: string | null
          capacity: number | null
          category_id: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          drop_in_price_pkr: number
          duration_minutes: number
          ends_on: string | null
          id: string
          instructor_name: string | null
          interval_weeks: number
          organizer_id: string
          published_at: string | null
          slug: string | null
          start_time: string
          starts_on: string
          status: Database["public"]["Enums"]["series_status"]
          tags: string[]
          title: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
          weekdays: number[]
        }
        Insert: {
          admin_status?: Database["public"]["Enums"]["admin_status"]
          area_label?: string | null
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          drop_in_price_pkr?: number
          duration_minutes?: number
          ends_on?: string | null
          id?: string
          instructor_name?: string | null
          interval_weeks?: number
          organizer_id: string
          published_at?: string | null
          slug?: string | null
          start_time: string
          starts_on: string
          status?: Database["public"]["Enums"]["series_status"]
          tags?: string[]
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
          weekdays?: number[]
        }
        Update: {
          admin_status?: Database["public"]["Enums"]["admin_status"]
          area_label?: string | null
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          drop_in_price_pkr?: number
          duration_minutes?: number
          ends_on?: string | null
          id?: string
          instructor_name?: string | null
          interval_weeks?: number
          organizer_id?: string
          published_at?: string | null
          slug?: string | null
          start_time?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["series_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "class_series_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_series_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_series_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          cancel_reason: string | null
          capacity: number | null
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          series_id: string
          starts_at: string
          status: Database["public"]["Enums"]["session_status"]
        }
        Insert: {
          cancel_reason?: string | null
          capacity?: number | null
          created_at?: string
          ends_at: string
          id?: string
          notes?: string | null
          series_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["session_status"]
        }
        Update: {
          cancel_reason?: string | null
          capacity?: number | null
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string | null
          series_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "class_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "public_class_series"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount_pkr: number
          created_at: string
          event_id: string
          id: string
          note: string | null
          organizer_id: string
          paid_at: string | null
          referrer_id: string
          registration_id: string
          status: Database["public"]["Enums"]["commission_status"]
        }
        Insert: {
          amount_pkr: number
          created_at?: string
          event_id: string
          id?: string
          note?: string | null
          organizer_id: string
          paid_at?: string | null
          referrer_id: string
          registration_id: string
          status?: Database["public"]["Enums"]["commission_status"]
        }
        Update: {
          amount_pkr?: number
          created_at?: string
          event_id?: string
          id?: string
          note?: string | null
          organizer_id?: string
          paid_at?: string | null
          referrer_id?: string
          registration_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "commissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      door_scans: {
        Row: {
          gate_link_id: string | null
          id: string
          kind: Database["public"]["Enums"]["scan_kind"]
          note: string | null
          organizer_id: string
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at: string
          scanned_by: string | null
          subject_id: string | null
        }
        Insert: {
          gate_link_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["scan_kind"]
          note?: string | null
          organizer_id: string
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanned_by?: string | null
          subject_id?: string | null
        }
        Update: {
          gate_link_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["scan_kind"]
          note?: string | null
          organizer_id?: string
          result?: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanned_by?: string | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "door_scans_gate_link_fk"
            columns: ["gate_link_id"]
            isOneToOne: false
            referencedRelation: "gate_staff_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_scans_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_scans_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_scans_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_scans_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          payload: Json
          sent_at: string | null
          status: string
          template: string
          to_email: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          template: string
          to_email: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          template?: string
          to_email?: string
        }
        Relationships: []
      }
      event_announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          event_id: string
          id: string
          send_email: boolean
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          event_id: string
          id?: string
          send_email?: boolean
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          event_id?: string
          id?: string
          send_email?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_announcements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_announcements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          color: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort: number
        }
        Insert: {
          color?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort?: number
        }
        Update: {
          color?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      event_favourites: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_favourites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_favourites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payment_accounts: {
        Row: {
          event_id: string
          payment_account_id: string
        }
        Insert: {
          event_id: string
          payment_account_id: string
        }
        Update: {
          event_id?: string
          payment_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_payment_accounts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
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
      event_secrets: {
        Row: {
          event_id: string
          reference_code: string | null
          require_reference_code: boolean
          reveal_at: string | null
          reveal_notified_at: string | null
          venue_address: string | null
          venue_notes: string | null
        }
        Insert: {
          event_id: string
          reference_code?: string | null
          require_reference_code?: boolean
          reveal_at?: string | null
          reveal_notified_at?: string | null
          venue_address?: string | null
          venue_notes?: string | null
        }
        Update: {
          event_id?: string
          reference_code?: string | null
          require_reference_code?: boolean
          reveal_at?: string | null
          reveal_notified_at?: string | null
          venue_address?: string | null
          venue_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_secrets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_secrets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          admin_status: Database["public"]["Enums"]["admin_status"]
          area_label: string | null
          capacity: number | null
          category_id: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          female_ratio_max: number | null
          id: string
          is_secret_venue: boolean
          male_ratio_max: number | null
          organizer_id: string
          published_at: string | null
          registration_mode: Database["public"]["Enums"]["registration_mode"]
          require_id_verified: boolean
          slug: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          tags: string[]
          title: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          admin_status?: Database["public"]["Enums"]["admin_status"]
          area_label?: string | null
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          female_ratio_max?: number | null
          id?: string
          is_secret_venue?: boolean
          male_ratio_max?: number | null
          organizer_id: string
          published_at?: string | null
          registration_mode?: Database["public"]["Enums"]["registration_mode"]
          require_id_verified?: boolean
          slug?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          tags?: string[]
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          admin_status?: Database["public"]["Enums"]["admin_status"]
          area_label?: string | null
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          female_ratio_max?: number | null
          id?: string
          is_secret_venue?: boolean
          male_ratio_max?: number | null
          organizer_id?: string
          published_at?: string | null
          registration_mode?: Database["public"]["Enums"]["registration_mode"]
          require_id_verified?: boolean
          slug?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          visibility?: Database["public"]["Enums"]["event_visibility"]
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
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_staff_links: {
        Row: {
          class_series_ids: string[]
          created_at: string
          event_ids: string[]
          expires_at: string
          id: string
          label: string
          last_used_at: string | null
          organizer_id: string
          retreat_ids: string[]
          revoked_at: string | null
          space_ids: string[]
          token_hash: string
        }
        Insert: {
          class_series_ids?: string[]
          created_at?: string
          event_ids: string[]
          expires_at: string
          id?: string
          label: string
          last_used_at?: string | null
          organizer_id: string
          retreat_ids?: string[]
          revoked_at?: string | null
          space_ids?: string[]
          token_hash: string
        }
        Update: {
          class_series_ids?: string[]
          created_at?: string
          event_ids?: string[]
          expires_at?: string
          id?: string
          label?: string
          last_used_at?: string | null
          organizer_id?: string
          retreat_ids?: string[]
          revoked_at?: string | null
          space_ids?: string[]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_staff_links_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gate_staff_links_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          event_id: string | null
          id: string
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_commission_defaults: {
        Row: {
          mode: Database["public"]["Enums"]["commission_mode"]
          organizer_id: string
          tiers: Json | null
          updated_at: string
          value: number
        }
        Insert: {
          mode?: Database["public"]["Enums"]["commission_mode"]
          organizer_id: string
          tiers?: Json | null
          updated_at?: string
          value?: number
        }
        Update: {
          mode?: Database["public"]["Enums"]["commission_mode"]
          organizer_id?: string
          tiers?: Json | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "organizer_commission_defaults_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_commission_defaults_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_favourites: {
        Row: {
          created_at: string
          organizer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organizer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          {
            foreignKeyName: "organizer_favourites_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_profiles: {
        Row: {
          bio: string | null
          company_name: string | null
          contact_email: string | null
          cover_url: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          public_contact: boolean
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          bio?: string | null
          company_name?: string | null
          contact_email?: string | null
          cover_url?: string | null
          id: string
          instagram?: string | null
          logo_url?: string | null
          public_contact?: boolean
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          bio?: string | null
          company_name?: string | null
          contact_email?: string | null
          cover_url?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          public_contact?: boolean
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"] | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          organizer_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          organizer_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          organizer_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_subscriptions_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_subscriptions_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_team_members: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invited_at: string
          invited_by: string | null
          organizer_id: string
          role: Database["public"]["Enums"]["team_role"]
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          organizer_id: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          organizer_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_team_members_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_team_members_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_vendor_invoices: {
        Row: {
          amount_pkr: number
          created_at: string
          description: string | null
          document_path: string | null
          due_date: string | null
          event_id: string | null
          id: string
          invoice_number: string | null
          organizer_id: string
          paid_at: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          amount_pkr: number
          created_at?: string
          description?: string | null
          document_path?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          invoice_number?: string | null
          organizer_id: string
          paid_at?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          amount_pkr?: number
          created_at?: string
          description?: string | null
          document_path?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          invoice_number?: string | null
          organizer_id?: string
          paid_at?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_vendor_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_vendor_invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_vendor_invoices_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_vendor_invoices_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_vendor_invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "organizer_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_vendors: {
        Row: {
          category: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          event_ids: string[]
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
          created_at?: string
          event_ids?: string[]
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
          created_at?: string
          event_ids?: string[]
          id?: string
          name?: string
          notes?: string | null
          organizer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_vendors_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_vendors_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      pass_products: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["pass_kind"]
          name: string
          organizer_id: string
          price_pkr: number
          series_id: string | null
          sessions_count: number | null
          sort: number
          validity_days: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["pass_kind"]
          name: string
          organizer_id: string
          price_pkr: number
          series_id?: string | null
          sessions_count?: number | null
          sort?: number
          validity_days?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["pass_kind"]
          name?: string
          organizer_id?: string
          price_pkr?: number
          series_id?: string | null
          sessions_count?: number | null
          sort?: number
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "pass_products_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_products_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_products_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "class_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_products_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "public_class_series"
            referencedColumns: ["id"]
          },
        ]
      }
      pass_purchases: {
        Row: {
          approved_at: string | null
          attendee_id: string
          created_at: string
          id: string
          organizer_id: string
          price_due_pkr: number
          price_paid_pkr: number | null
          product_id: string
          qr_token: string
          sessions_total: number | null
          sessions_used: number
          status: Database["public"]["Enums"]["pass_status"]
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          attendee_id: string
          created_at?: string
          id?: string
          organizer_id: string
          price_due_pkr?: number
          price_paid_pkr?: number | null
          product_id: string
          qr_token?: string
          sessions_total?: number | null
          sessions_used?: number
          status?: Database["public"]["Enums"]["pass_status"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          attendee_id?: string
          created_at?: string
          id?: string
          organizer_id?: string
          price_due_pkr?: number
          price_paid_pkr?: number | null
          product_id?: string
          qr_token?: string
          sessions_total?: number | null
          sessions_used?: number
          status?: Database["public"]["Enums"]["pass_status"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pass_purchases_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_purchases_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_purchases_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_purchases_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pass_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_pass_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pass_redemptions: {
        Row: {
          booking_id: string
          id: string
          pass_purchase_id: string
          redeemed_at: string
        }
        Insert: {
          booking_id: string
          id?: string
          pass_purchase_id: string
          redeemed_at?: string
        }
        Update: {
          booking_id?: string
          id?: string
          pass_purchase_id?: string
          redeemed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pass_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "class_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_redemptions_pass_purchase_id_fkey"
            columns: ["pass_purchase_id"]
            isOneToOne: false
            referencedRelation: "pass_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          account_number: string
          account_title: string
          bank_name: string | null
          created_at: string
          iban: string | null
          id: string
          instructions: string | null
          is_active: boolean
          label: string | null
          method: Database["public"]["Enums"]["payment_method"]
          organizer_id: string
        }
        Insert: {
          account_number: string
          account_title: string
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          label?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          organizer_id: string
        }
        Update: {
          account_number?: string
          account_title?: string
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          label?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          organizer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_accounts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_submissions: {
        Row: {
          amount_pkr: number | null
          created_at: string
          id: string
          reason: string | null
          reference: string | null
          registration_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          amount_pkr?: number | null
          created_at?: string
          id?: string
          reason?: string | null
          reference?: string | null
          registration_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          amount_pkr?: number | null
          created_at?: string
          id?: string
          reason?: string | null
          reference?: string | null
          registration_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_submissions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          key: string
          plan_id: string
          value: Json
        }
        Insert: {
          key: string
          plan_id: string
          value: Json
        }
        Update: {
          key?: string
          plan_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          id: string
          is_purchasable: boolean
          name: string
          price_pkr_month: number
          price_pkr_year: number
          sort: number
        }
        Insert: {
          id: string
          is_purchasable?: boolean
          name: string
          price_pkr_month?: number
          price_pkr_year?: number
          sort?: number
        }
        Update: {
          id?: string
          is_purchasable?: boolean
          name?: string
          price_pkr_month?: number
          price_pkr_year?: number
          sort?: number
        }
        Relationships: []
      }
      product_payments: {
        Row: {
          amount_pkr: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["product_kind"]
          organizer_id: string
          payer_id: string
          reference: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string
          status: Database["public"]["Enums"]["review_status"]
          subject_id: string
        }
        Insert: {
          amount_pkr: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["product_kind"]
          organizer_id: string
          payer_id: string
          reference?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path: string
          status?: Database["public"]["Enums"]["review_status"]
          subject_id: string
        }
        Update: {
          amount_pkr?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["product_kind"]
          organizer_id?: string
          payer_id?: string
          reference?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string
          status?: Database["public"]["Enums"]["review_status"]
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_payments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_payments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          date_of_birth: string | null
          email: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          id_expiry: string | null
          id_image_path: string | null
          id_number_enc: string | null
          id_reject_reason: string | null
          id_reviewed_at: string | null
          id_reviewed_by: string | null
          id_status: Database["public"]["Enums"]["id_status"]
          id_submitted_at: string | null
          id_type: Database["public"]["Enums"]["id_type"] | null
          notification_prefs: Json
          phone: string | null
          updated_at: string
        }
        Insert: {
          date_of_birth?: string | null
          email: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          id_expiry?: string | null
          id_image_path?: string | null
          id_number_enc?: string | null
          id_reject_reason?: string | null
          id_reviewed_at?: string | null
          id_reviewed_by?: string | null
          id_status?: Database["public"]["Enums"]["id_status"]
          id_submitted_at?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          notification_prefs?: Json
          phone?: string | null
          updated_at?: string
        }
        Update: {
          date_of_birth?: string | null
          email?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          id_expiry?: string | null
          id_image_path?: string | null
          id_number_enc?: string | null
          id_reject_reason?: string | null
          id_reviewed_at?: string | null
          id_reviewed_by?: string | null
          id_status?: Database["public"]["Enums"]["id_status"]
          id_submitted_at?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          notification_prefs?: Json
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_private_id_reviewed_by_fkey"
            columns: ["id_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_private_id_reviewed_by_fkey"
            columns: ["id_reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string
          created_at: string
          full_name: string
          id: string
          is_complete: boolean
          role: Database["public"]["Enums"]["user_role"]
          ui_theme: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          full_name: string
          id: string
          is_complete?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          ui_theme?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_complete?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          ui_theme?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          buyer_discount_type:
            | Database["public"]["Enums"]["discount_type"]
            | null
          buyer_discount_value: number | null
          code: string
          commission_mode: Database["public"]["Enums"]["commission_mode"] | null
          commission_tiers: Json | null
          commission_value: number | null
          created_at: string
          discount_funded_by: Database["public"]["Enums"]["discount_funder"]
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          referrer_id: string
          uses: number
        }
        Insert: {
          buyer_discount_type?:
            | Database["public"]["Enums"]["discount_type"]
            | null
          buyer_discount_value?: number | null
          code: string
          commission_mode?:
            | Database["public"]["Enums"]["commission_mode"]
            | null
          commission_tiers?: Json | null
          commission_value?: number | null
          created_at?: string
          discount_funded_by?: Database["public"]["Enums"]["discount_funder"]
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          referrer_id: string
          uses?: number
        }
        Update: {
          buyer_discount_type?:
            | Database["public"]["Enums"]["discount_type"]
            | null
          buyer_discount_value?: number | null
          code?: string
          commission_mode?:
            | Database["public"]["Enums"]["commission_mode"]
            | null
          commission_tiers?: Json | null
          commission_value?: number | null
          created_at?: string
          discount_funded_by?: Database["public"]["Enums"]["discount_funder"]
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          referrer_id?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
        ]
      }
      referrers: {
        Row: {
          access_token_hash: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          organizer_id: string
          phone: string | null
        }
        Insert: {
          access_token_hash?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          organizer_id: string
          phone?: string | null
        }
        Update: {
          access_token_hash?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organizer_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrers_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrers_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          approved_at: string | null
          attendee_id: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          coupon_id: string | null
          created_at: string
          discount_pkr: number
          email: string | null
          event_id: string
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          is_vip: boolean
          notes: string | null
          phone: string | null
          plus_one: boolean
          plus_one_name: string | null
          price_due_pkr: number
          price_paid_pkr: number | null
          qr_token: string
          reference_code_entered: string | null
          referral_link_id: string | null
          referrer_id: string | null
          source: Database["public"]["Enums"]["registration_source"]
          status: Database["public"]["Enums"]["registration_status"]
          status_reason: string | null
          ticket_days: string[] | null
          ticket_type_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          attendee_id?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_pkr?: number
          email?: string | null
          event_id: string
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_vip?: boolean
          notes?: string | null
          phone?: string | null
          plus_one?: boolean
          plus_one_name?: string | null
          price_due_pkr?: number
          price_paid_pkr?: number | null
          qr_token?: string
          reference_code_entered?: string | null
          referral_link_id?: string | null
          referrer_id?: string | null
          source?: Database["public"]["Enums"]["registration_source"]
          status?: Database["public"]["Enums"]["registration_status"]
          status_reason?: string | null
          ticket_days?: string[] | null
          ticket_type_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          attendee_id?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_pkr?: number
          email?: string | null
          event_id?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_vip?: boolean
          notes?: string | null
          phone?: string | null
          plus_one?: boolean
          plus_one_name?: string | null
          price_due_pkr?: number
          price_paid_pkr?: number | null
          qr_token?: string
          reference_code_entered?: string | null
          referral_link_id?: string | null
          referrer_id?: string | null
          source?: Database["public"]["Enums"]["registration_source"]
          status?: Database["public"]["Enums"]["registration_status"]
          status_reason?: string | null
          ticket_days?: string[] | null
          ticket_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_referral_link_id_fkey"
            columns: ["referral_link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "public_ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_budget_lines: {
        Row: {
          actual_pkr: number | null
          category: string
          created_at: string
          estimated_pkr: number
          id: string
          is_paid: boolean
          item_id: string | null
          label: string
          notes: string | null
          retreat_id: string
          vendor_id: string | null
        }
        Insert: {
          actual_pkr?: number | null
          category?: string
          created_at?: string
          estimated_pkr?: number
          id?: string
          is_paid?: boolean
          item_id?: string | null
          label: string
          notes?: string | null
          retreat_id: string
          vendor_id?: string | null
        }
        Update: {
          actual_pkr?: number | null
          category?: string
          created_at?: string
          estimated_pkr?: number
          id?: string
          is_paid?: boolean
          item_id?: string | null
          label?: string
          notes?: string | null
          retreat_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retreat_budget_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "retreat_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_budget_lines_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_budget_lines_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "organizer_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_checkins: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          id: string
          item_id: string
          participant_id: string
          retreat_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          id?: string
          item_id: string
          participant_id: string
          retreat_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          id?: string
          item_id?: string
          participant_id?: string
          retreat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retreat_checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_checkins_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "retreat_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_checkins_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "retreat_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_checkins_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_days: {
        Row: {
          day_date: string
          day_number: number
          id: string
          retreat_id: string
          summary: string | null
          title: string | null
        }
        Insert: {
          day_date: string
          day_number: number
          id?: string
          retreat_id: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          day_date?: string
          day_number?: number
          id?: string
          retreat_id?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retreat_days_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_documents: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean
          item_id: string | null
          name: string
          retreat_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean
          item_id?: string | null
          name: string
          retreat_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean
          item_id?: string | null
          name?: string
          retreat_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "retreat_documents_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "retreat_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_documents_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_items: {
        Row: {
          assignee: string | null
          cost_pkr: number
          created_at: string
          day_id: string
          description: string | null
          ends_at: string | null
          id: string
          is_internal: boolean
          kind: Database["public"]["Enums"]["retreat_item_kind"]
          latitude: number | null
          location_address: string | null
          location_name: string | null
          longitude: number | null
          notes: string | null
          requires_checkin: boolean
          retreat_id: string
          sort: number
          starts_at: string | null
          status: Database["public"]["Enums"]["retreat_item_status"]
          title: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          assignee?: string | null
          cost_pkr?: number
          created_at?: string
          day_id: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_internal?: boolean
          kind?: Database["public"]["Enums"]["retreat_item_kind"]
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          requires_checkin?: boolean
          retreat_id: string
          sort?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["retreat_item_status"]
          title: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          assignee?: string | null
          cost_pkr?: number
          created_at?: string
          day_id?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_internal?: boolean
          kind?: Database["public"]["Enums"]["retreat_item_kind"]
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          requires_checkin?: boolean
          retreat_id?: string
          sort?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["retreat_item_status"]
          title?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retreat_items_retreat_id_day_id_fkey"
            columns: ["retreat_id", "day_id"]
            isOneToOne: false
            referencedRelation: "retreat_days"
            referencedColumns: ["retreat_id", "id"]
          },
          {
            foreignKeyName: "retreat_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "organizer_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_participants: {
        Row: {
          accessibility: string | null
          attendee_id: string | null
          created_at: string
          department: string | null
          dietary: string | null
          email: string | null
          emergency_contact: string | null
          full_name: string
          id: string
          phone: string | null
          qr_token: string
          retreat_id: string
          room_label: string | null
          status: Database["public"]["Enums"]["participant_status"]
        }
        Insert: {
          accessibility?: string | null
          attendee_id?: string | null
          created_at?: string
          department?: string | null
          dietary?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          id?: string
          phone?: string | null
          qr_token?: string
          retreat_id: string
          room_label?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
        }
        Update: {
          accessibility?: string | null
          attendee_id?: string | null
          created_at?: string
          department?: string | null
          dietary?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          qr_token?: string
          retreat_id?: string
          room_label?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
        }
        Relationships: [
          {
            foreignKeyName: "retreat_participants_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_participants_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_participants_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_tasks: {
        Row: {
          assignee_name: string | null
          created_at: string
          done_at: string | null
          due_date: string | null
          id: string
          is_done: boolean
          retreat_id: string
          sort: number
          title: string
        }
        Insert: {
          assignee_name?: string | null
          created_at?: string
          done_at?: string | null
          due_date?: string | null
          id?: string
          is_done?: boolean
          retreat_id: string
          sort?: number
          title: string
        }
        Update: {
          assignee_name?: string | null
          created_at?: string
          done_at?: string | null
          due_date?: string | null
          id?: string
          is_done?: boolean
          retreat_id?: string
          sort?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "retreat_tasks_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
        ]
      }
      retreat_updates: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          retreat_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          retreat_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          retreat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retreat_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreat_updates_retreat_id_fkey"
            columns: ["retreat_id"]
            isOneToOne: false
            referencedRelation: "retreats"
            referencedColumns: ["id"]
          },
        ]
      }
      retreats: {
        Row: {
          accent_color: string | null
          budget_pkr: number | null
          city: string | null
          client_company: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          destination: string | null
          ends_on: string
          headcount_target: number | null
          id: string
          notes: string | null
          organizer_id: string
          share_token: string | null
          slug: string | null
          starts_on: string
          status: Database["public"]["Enums"]["retreat_status"]
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          budget_pkr?: number | null
          city?: string | null
          client_company?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          destination?: string | null
          ends_on: string
          headcount_target?: number | null
          id?: string
          notes?: string | null
          organizer_id: string
          share_token?: string | null
          slug?: string | null
          starts_on: string
          status?: Database["public"]["Enums"]["retreat_status"]
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          budget_pkr?: number | null
          city?: string | null
          client_company?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          destination?: string | null
          ends_on?: string
          headcount_target?: number | null
          id?: string
          notes?: string | null
          organizer_id?: string
          share_token?: string | null
          slug?: string | null
          starts_on?: string
          status?: Database["public"]["Enums"]["retreat_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retreats_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retreats_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          event_id: string
          gate_link_id: string | null
          id: string
          note: string | null
          offline_synced: boolean
          registration_id: string | null
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at: string
          scanned_by: string | null
        }
        Insert: {
          event_id: string
          gate_link_id?: string | null
          id?: string
          note?: string | null
          offline_synced?: boolean
          registration_id?: string | null
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanned_by?: string | null
        }
        Update: {
          event_id?: string
          gate_link_id?: string | null
          id?: string
          note?: string | null
          offline_synced?: boolean
          registration_id?: string | null
          result?: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_gate_link_id_fkey"
            columns: ["gate_link_id"]
            isOneToOne: false
            referencedRelation: "gate_staff_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      score_events: {
        Row: {
          attendee_id: string
          created_at: string
          delta: number
          event_id: string | null
          id: string
          reason: string
          registration_id: string | null
        }
        Insert: {
          attendee_id: string
          created_at?: string
          delta: number
          event_id?: string | null
          id?: string
          reason: string
          registration_id?: string | null
        }
        Update: {
          attendee_id?: string
          created_at?: string
          delta?: number
          event_id?: string | null
          id?: string
          reason?: string
          registration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_events_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_event_fk"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_event_fk"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_registration_fk"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      space_blackouts: {
        Row: {
          ends_at: string
          id: string
          reason: string | null
          space_id: string
          starts_at: string
        }
        Insert: {
          ends_at: string
          id?: string
          reason?: string | null
          space_id: string
          starts_at: string
        }
        Update: {
          ends_at?: string
          id?: string
          reason?: string | null
          space_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_blackouts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_blackouts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_bookings: {
        Row: {
          approved_at: string | null
          attendee_id: string
          blocked_until: string
          cancelled_at: string | null
          checked_in_at: string | null
          created_at: string
          ends_at: string
          id: string
          notes: string | null
          organizer_id: string
          party_size: number
          price_due_pkr: number
          price_paid_pkr: number | null
          qr_token: string
          space_id: string
          starts_at: string
          status: Database["public"]["Enums"]["registration_status"]
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          attendee_id: string
          blocked_until: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          notes?: string | null
          organizer_id: string
          party_size?: number
          price_due_pkr?: number
          price_paid_pkr?: number | null
          qr_token?: string
          space_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["registration_status"]
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          attendee_id?: string
          blocked_until?: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          notes?: string | null
          organizer_id?: string
          party_size?: number
          price_due_pkr?: number
          price_paid_pkr?: number | null
          qr_token?: string
          space_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["registration_status"]
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_bookings_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_bookings_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_bookings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_bookings_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_bookings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_bookings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_hours: {
        Row: {
          closes: string
          id: string
          opens: string
          space_id: string
          weekday: number
        }
        Insert: {
          closes: string
          id?: string
          opens: string
          space_id: string
          weekday: number
        }
        Update: {
          closes?: string
          id?: string
          opens?: string
          space_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "space_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          address: string | null
          admin_status: Database["public"]["Enums"]["admin_status"]
          amenities: string[]
          area_label: string | null
          buffer_minutes: number
          capacity: number | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["space_kind"]
          max_advance_days: number
          min_notice_hours: number
          name: string
          organizer_id: string
          photos: string[]
          price_pkr_per_slot: number
          published_at: string | null
          requires_approval: boolean
          slot_minutes: number
          slug: string | null
          status: Database["public"]["Enums"]["space_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          address?: string | null
          admin_status?: Database["public"]["Enums"]["admin_status"]
          amenities?: string[]
          area_label?: string | null
          buffer_minutes?: number
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["space_kind"]
          max_advance_days?: number
          min_notice_hours?: number
          name: string
          organizer_id: string
          photos?: string[]
          price_pkr_per_slot?: number
          published_at?: string | null
          requires_approval?: boolean
          slot_minutes?: number
          slug?: string | null
          status?: Database["public"]["Enums"]["space_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          address?: string | null
          admin_status?: Database["public"]["Enums"]["admin_status"]
          amenities?: string[]
          area_label?: string | null
          buffer_minutes?: number
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["space_kind"]
          max_advance_days?: number
          min_notice_hours?: number
          name?: string
          organizer_id?: string
          photos?: string[]
          price_pkr_per_slot?: number
          published_at?: string | null
          requires_approval?: boolean
          slot_minutes?: number
          slug?: string | null
          status?: Database["public"]["Enums"]["space_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "spaces_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount_pkr: number
          id: string
          issued_at: string
          number: string
          organizer_id: string
          payment_id: string
          period: Database["public"]["Enums"]["billing_period"]
          period_end: string
          period_start: string
          plan_id: string
        }
        Insert: {
          amount_pkr: number
          id?: string
          issued_at?: string
          number: string
          organizer_id: string
          payment_id: string
          period: Database["public"]["Enums"]["billing_period"]
          period_end: string
          period_start: string
          plan_id: string
        }
        Update: {
          amount_pkr?: number
          id?: string
          issued_at?: string
          number?: string
          organizer_id?: string
          payment_id?: string
          period?: Database["public"]["Enums"]["billing_period"]
          period_end?: string
          period_start?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "subscription_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount_pkr: number
          created_at: string
          id: string
          organizer_id: string
          period: Database["public"]["Enums"]["billing_period"]
          plan_id: string
          reference: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          amount_pkr: number
          created_at?: string
          id?: string
          organizer_id: string
          period: Database["public"]["Enums"]["billing_period"]
          plan_id: string
          reference?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          amount_pkr?: number
          created_at?: string
          id?: string
          organizer_id?: string
          period?: Database["public"]["Enums"]["billing_period"]
          plan_id?: string
          reference?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_vip: boolean
          name: string
          original_price_pkr: number | null
          price_pkr: number
          quantity: number | null
          sales_end: string | null
          sales_start: string | null
          sort: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_vip?: boolean
          name: string
          original_price_pkr?: number | null
          price_pkr?: number
          quantity?: number | null
          sales_end?: string | null
          sales_start?: string | null
          sort?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_vip?: boolean
          name?: string
          original_price_pkr?: number | null
          price_pkr?: number
          quantity?: number | null
          sales_end?: string | null
          sales_start?: string | null
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_listings: {
        Row: {
          area_label: string | null
          capacity: number | null
          category_id: string | null
          city: string | null
          cover_image_url: string | null
          description: string | null
          ends_at: string | null
          female_ratio_max: number | null
          id: string | null
          is_secret_venue: boolean | null
          male_ratio_max: number | null
          min_price_pkr: number | null
          organizer_id: string | null
          registration_mode:
            | Database["public"]["Enums"]["registration_mode"]
            | null
          require_id_verified: boolean | null
          reveal_at: string | null
          seats_taken: number | null
          slug: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          tags: string[] | null
          title: string | null
          venue_address: string | null
          venue_name: string | null
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
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      public_class_series: {
        Row: {
          area_label: string | null
          capacity: number | null
          category_id: string | null
          city: string | null
          cover_image_url: string | null
          description: string | null
          drop_in_price_pkr: number | null
          duration_minutes: number | null
          ends_on: string | null
          id: string | null
          instructor_name: string | null
          interval_weeks: number | null
          next_session_at: string | null
          organizer_id: string | null
          slug: string | null
          start_time: string | null
          starts_on: string | null
          tags: string[] | null
          title: string | null
          venue_address: string | null
          venue_name: string | null
          weekdays: number[] | null
        }
        Insert: {
          area_label?: string | null
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          cover_image_url?: string | null
          description?: string | null
          drop_in_price_pkr?: number | null
          duration_minutes?: number | null
          ends_on?: string | null
          id?: string | null
          instructor_name?: string | null
          interval_weeks?: number | null
          next_session_at?: never
          organizer_id?: string | null
          slug?: string | null
          start_time?: string | null
          starts_on?: string | null
          tags?: string[] | null
          title?: string | null
          venue_address?: string | null
          venue_name?: string | null
          weekdays?: number[] | null
        }
        Update: {
          area_label?: string | null
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          cover_image_url?: string | null
          description?: string | null
          drop_in_price_pkr?: number | null
          duration_minutes?: number | null
          ends_on?: string | null
          id?: string | null
          instructor_name?: string | null
          interval_weeks?: number | null
          next_session_at?: never
          organizer_id?: string | null
          slug?: string | null
          start_time?: string | null
          starts_on?: string | null
          tags?: string[] | null
          title?: string | null
          venue_address?: string | null
          venue_name?: string | null
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "class_series_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_series_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_series_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      public_class_sessions: {
        Row: {
          ends_at: string | null
          id: string | null
          notes: string | null
          seats_left: number | null
          series_id: string | null
          starts_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "class_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "public_class_series"
            referencedColumns: ["id"]
          },
        ]
      }
      public_organizers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          contact_email: string | null
          cover_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          instagram: string | null
          is_verified: boolean | null
          logo_url: string | null
          upcoming_event_count: number | null
          username: string | null
          website: string | null
          whatsapp: string | null
        }
        Relationships: []
      }
      public_pass_products: {
        Row: {
          id: string | null
          kind: Database["public"]["Enums"]["pass_kind"] | null
          name: string | null
          organizer_id: string | null
          price_pkr: number | null
          series_id: string | null
          sessions_count: number | null
          sort: number | null
          validity_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pass_products_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_products_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_products_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "class_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pass_products_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "public_class_series"
            referencedColumns: ["id"]
          },
        ]
      }
      public_space_hours: {
        Row: {
          closes: string | null
          opens: string | null
          space_id: string | null
          weekday: number | null
        }
        Relationships: [
          {
            foreignKeyName: "space_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      public_spaces: {
        Row: {
          address: string | null
          amenities: string[] | null
          area_label: string | null
          capacity: number | null
          city: string | null
          description: string | null
          id: string | null
          kind: Database["public"]["Enums"]["space_kind"] | null
          max_advance_days: number | null
          min_notice_hours: number | null
          name: string | null
          organizer_id: string | null
          photos: string[] | null
          price_pkr_per_slot: number | null
          requires_approval: boolean | null
          slot_minutes: number | null
          slug: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area_label?: string | null
          capacity?: number | null
          city?: string | null
          description?: string | null
          id?: string | null
          kind?: Database["public"]["Enums"]["space_kind"] | null
          max_advance_days?: number | null
          min_notice_hours?: number | null
          name?: string | null
          organizer_id?: string | null
          photos?: string[] | null
          price_pkr_per_slot?: number | null
          requires_approval?: boolean | null
          slot_minutes?: number | null
          slug?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area_label?: string | null
          capacity?: number | null
          city?: string | null
          description?: string | null
          id?: string | null
          kind?: Database["public"]["Enums"]["space_kind"] | null
          max_advance_days?: number | null
          min_notice_hours?: number | null
          name?: string | null
          organizer_id?: string | null
          photos?: string[] | null
          price_pkr_per_slot?: number | null
          requires_approval?: boolean | null
          slot_minutes?: number | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spaces_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      public_ticket_types: {
        Row: {
          event_id: string | null
          id: string | null
          is_vip: boolean | null
          name: string | null
          original_price_pkr: number | null
          price_pkr: number | null
          sales_end: string | null
          sales_start: string | null
          seats_left: number | null
          sort: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_manual_registration: {
        Args: {
          p_days?: string[]
          p_email?: string
          p_event: string
          p_full_name: string
          p_is_vip?: boolean
          p_phone?: string
          p_plus_one?: boolean
          p_source?: Database["public"]["Enums"]["registration_source"]
          p_ticket_type?: string
        }
        Returns: string
      }
      admin_set_event_status: {
        Args: {
          p_event: string
          p_status: Database["public"]["Enums"]["admin_status"]
        }
        Returns: undefined
      }
      book_class_session: {
        Args: { p_pass?: string; p_session: string }
        Returns: string
      }
      book_space: {
        Args: {
          p_notes?: string
          p_party_size?: number
          p_space: string
          p_starts_at: string
        }
        Returns: string
      }
      cancel_class_booking: { Args: { p_booking: string }; Returns: undefined }
      cancel_class_session: {
        Args: { p_reason?: string; p_session: string }
        Returns: number
      }
      cancel_registration: {
        Args: { p_registration: string }
        Returns: undefined
      }
      cancel_space_booking: { Args: { p_booking: string }; Returns: undefined }
      claim_registrations: { Args: never; Returns: number }
      claim_retreat_invites: { Args: never; Returns: number }
      claim_team_invites: { Args: never; Returns: number }
      create_gate_link: {
        Args: { p_event_ids: string[]; p_label: string }
        Returns: Json
      }
      create_gate_link_scoped: {
        Args: {
          p_event_ids: string[]
          p_label: string
          p_retreat_ids: string[]
          p_series_ids: string[]
          p_space_ids: string[]
        }
        Returns: Json
      }
      create_referrer: {
        Args: { p_email?: string; p_name: string; p_phone?: string }
        Returns: Json
      }
      disable_retreat_sharing: {
        Args: { p_retreat: string }
        Returns: undefined
      }
      duplicate_retreat: {
        Args: { p_new_start: string; p_retreat: string }
        Returns: string
      }
      enable_retreat_sharing: { Args: { p_retreat: string }; Returns: string }
      gate_check_in: {
        Args: {
          p_event: string
          p_link_token: string
          p_offline?: boolean
          p_registration?: string
          p_token?: string
        }
        Returns: Json
      }
      gate_get_events: {
        Args: { p_link_token: string }
        Returns: {
          admitted: number
          ends_at: string
          expected: number
          id: string
          starts_at: string
          title: string
        }[]
      }
      gate_get_scope: { Args: { p_link_token: string }; Returns: Json }
      gate_lookup: {
        Args: { p_event: string; p_link_token: string; p_query: string }
        Returns: {
          full_name: string
          is_vip: boolean
          plus_one: boolean
          registration_id: string
          status: Database["public"]["Enums"]["registration_status"]
          ticket: string
        }[]
      }
      gate_scan_any: {
        Args: {
          p_context?: string
          p_link_token: string
          p_offline?: boolean
          p_token: string
        }
        Returns: Json
      }
      generate_class_sessions: {
        Args: { p_series: string; p_weeks?: number }
        Returns: number
      }
      get_class_series: {
        Args: { p_slug: string }
        Returns: {
          area_label: string
          capacity: number
          category_id: string
          city: string
          cover_image_url: string
          description: string
          drop_in_price_pkr: number
          duration_minutes: number
          ends_on: string
          id: string
          instructor_name: string
          interval_weeks: number
          organizer_id: string
          slug: string
          start_time: string
          starts_on: string
          tags: string[]
          title: string
          venue_address: string
          venue_name: string
          weekdays: number[]
        }[]
      }
      get_event: {
        Args: { p_slug: string }
        Returns: {
          area_label: string | null
          capacity: number | null
          category_id: string | null
          city: string | null
          cover_image_url: string | null
          description: string | null
          ends_at: string | null
          female_ratio_max: number | null
          id: string | null
          is_secret_venue: boolean | null
          male_ratio_max: number | null
          min_price_pkr: number | null
          organizer_id: string | null
          registration_mode:
            | Database["public"]["Enums"]["registration_mode"]
            | null
          require_id_verified: boolean | null
          reveal_at: string | null
          seats_taken: number | null
          slug: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          tags: string[] | null
          title: string | null
          venue_address: string | null
          venue_name: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "event_listings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_event_secret: { Args: { p_event: string }; Returns: Json }
      get_participant_itinerary: { Args: { p_token: string }; Returns: Json }
      get_registrant_scores: {
        Args: { p_event: string }
        Returns: {
          attended: number
          attendee_id: string
          id_verified: boolean
          no_shows: number
          registration_id: string
          score: number
          tier: Database["public"]["Enums"]["score_tier"]
        }[]
      }
      get_shared_retreat: { Args: { p_token: string }; Returns: Json }
      get_space: {
        Args: { p_slug: string }
        Returns: {
          address: string | null
          amenities: string[] | null
          area_label: string | null
          capacity: number | null
          city: string | null
          description: string | null
          id: string | null
          kind: Database["public"]["Enums"]["space_kind"] | null
          max_advance_days: number | null
          min_notice_hours: number | null
          name: string | null
          organizer_id: string | null
          photos: string[] | null
          price_pkr_per_slot: number | null
          requires_approval: boolean | null
          slot_minutes: number | null
          slug: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "public_spaces"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_top_organizers: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          contact_email: string | null
          cover_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          instagram: string | null
          is_verified: boolean | null
          logo_url: string | null
          upcoming_event_count: number | null
          username: string | null
          website: string | null
          whatsapp: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "public_organizers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      invite_team_member: { Args: { p_email: string }; Returns: string }
      master_modules_overview: { Args: never; Returns: Json }
      master_overview: { Args: never; Returns: Json }
      my_entitlements: { Args: never; Returns: Json }
      my_retreats: {
        Args: never
        Returns: {
          destination: string
          ends_on: string
          qr_token: string
          retreat_id: string
          starts_on: string
          status: Database["public"]["Enums"]["retreat_status"]
          title: string
        }[]
      }
      organizer_check_in: {
        Args: { p_event: string; p_registration?: string; p_token?: string }
        Returns: Json
      }
      post_retreat_update: {
        Args: { p_body: string; p_retreat: string; p_send_email?: boolean }
        Returns: string
      }
      preview_code: {
        Args: { p_code: string; p_event: string; p_ticket_type?: string }
        Returns: Json
      }
      process_class_sessions: { Args: never; Returns: number }
      process_no_shows: { Args: never; Returns: number }
      process_space_bookings: { Args: never; Returns: number }
      promoter_dashboard: { Args: { p_token: string }; Returns: Json }
      publish_announcement: {
        Args: { p_body: string; p_event: string; p_send_email?: boolean }
        Returns: string
      }
      purchase_pass: { Args: { p_product: string }; Returns: string }
      register_for_event: {
        Args: {
          p_code?: string
          p_days?: string[]
          p_event: string
          p_notes?: string
          p_phone?: string
          p_plus_one?: boolean
          p_plus_one_name?: string
          p_reference_code?: string
          p_ticket_type?: string
        }
        Returns: string
      }
      remove_team_member: { Args: { p_id: string }; Returns: undefined }
      retreat_check_in: {
        Args: { p_item: string; p_token: string }
        Returns: Json
      }
      retreat_summary: { Args: { p_retreat: string }; Returns: Json }
      reveal_due_events: { Args: never; Returns: number }
      review_id_verification: {
        Args: { p_approve: boolean; p_reason?: string; p_user: string }
        Returns: undefined
      }
      review_payment: {
        Args: { p_approve: boolean; p_reason?: string; p_submission: string }
        Returns: Database["public"]["Enums"]["registration_status"]
      }
      review_product_payment: {
        Args: { p_approve: boolean; p_payment: string; p_reason?: string }
        Returns: Database["public"]["Enums"]["review_status"]
      }
      review_registration: {
        Args: { p_approve: boolean; p_reason?: string; p_registration: string }
        Returns: Database["public"]["Enums"]["registration_status"]
      }
      review_space_booking: {
        Args: { p_approve: boolean; p_booking: string; p_reason?: string }
        Returns: Database["public"]["Enums"]["registration_status"]
      }
      review_subscription_payment: {
        Args: { p_approve: boolean; p_payment: string; p_reason?: string }
        Returns: string
      }
      revoke_gate_link: { Args: { p_id: string }; Returns: undefined }
      rotate_referrer_token: { Args: { p_referrer: string }; Returns: string }
      scan_any: { Args: { p_context?: string; p_token: string }; Returns: Json }
      space_open_slots: {
        Args: { p_date: string; p_space: string }
        Returns: {
          is_available: boolean
          slot_end: string
          slot_start: string
        }[]
      }
      submit_id_verification: {
        Args: {
          p_expiry?: string
          p_id_type: Database["public"]["Enums"]["id_type"]
          p_image_path: string
          p_number_enc: string
        }
        Returns: undefined
      }
      submit_payment: {
        Args: {
          p_reference?: string
          p_registration: string
          p_screenshot_path: string
        }
        Returns: string
      }
      submit_product_payment: {
        Args: {
          p_kind: Database["public"]["Enums"]["product_kind"]
          p_reference?: string
          p_screenshot_path: string
          p_subject: string
        }
        Returns: string
      }
      submit_subscription_payment: {
        Args: {
          p_period: Database["public"]["Enums"]["billing_period"]
          p_plan: string
          p_reference?: string
          p_screenshot_path: string
        }
        Returns: string
      }
    }
    Enums: {
      admin_status: "live" | "flagged" | "suspended"
      billing_period: "month" | "year"
      commission_mode: "none" | "percent" | "fixed" | "tiered"
      commission_status: "accrued" | "approved" | "paid" | "void"
      discount_funder: "organizer" | "referrer" | "split"
      discount_type: "percent" | "fixed"
      event_status:
        | "draft"
        | "published"
        | "completed"
        | "cancelled"
        | "archived"
      event_visibility: "public" | "private"
      gender: "male" | "female" | "other"
      id_status: "none" | "pending" | "verified" | "rejected"
      id_type: "cnic" | "passport"
      participant_status: "invited" | "confirmed" | "declined"
      pass_kind: "pack" | "monthly"
      pass_status:
        | "awaiting_payment"
        | "payment_submitted"
        | "active"
        | "exhausted"
        | "expired"
        | "cancelled"
        | "rejected"
      payment_method: "bank" | "jazzcash" | "easypaisa" | "other"
      product_kind: "pass_purchase" | "class_booking" | "space_booking"
      registration_mode: "open" | "approval"
      registration_source: "self" | "invited" | "manual"
      registration_status:
        | "requested"
        | "awaiting_payment"
        | "payment_submitted"
        | "confirmed"
        | "checked_in"
        | "rejected"
        | "cancelled"
        | "waitlisted"
        | "no_show"
      retreat_item_kind:
        | "activity"
        | "meal"
        | "transport"
        | "stay"
        | "session"
        | "free_time"
        | "milestone"
      retreat_item_status:
        | "planned"
        | "confirmed"
        | "in_progress"
        | "done"
        | "skipped"
      retreat_status:
        | "planning"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      review_status: "submitted" | "approved" | "rejected"
      scan_kind: "class" | "space" | "retreat"
      scan_result:
        | "admitted"
        | "duplicate"
        | "not_approved"
        | "wrong_day"
        | "invalid"
      score_tier: "new" | "reliable" | "regular" | "trusted"
      series_status: "draft" | "published" | "paused" | "ended"
      session_status: "scheduled" | "cancelled" | "completed"
      space_kind: "room" | "court" | "studio" | "desk" | "table" | "other"
      space_status: "draft" | "published" | "paused"
      subscription_status:
        | "trial"
        | "active"
        | "grace"
        | "expired"
        | "cancelled"
      team_role: "manager"
      user_role: "organizer" | "attendee" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_status: ["live", "flagged", "suspended"],
      billing_period: ["month", "year"],
      commission_mode: ["none", "percent", "fixed", "tiered"],
      commission_status: ["accrued", "approved", "paid", "void"],
      discount_funder: ["organizer", "referrer", "split"],
      discount_type: ["percent", "fixed"],
      event_status: [
        "draft",
        "published",
        "completed",
        "cancelled",
        "archived",
      ],
      event_visibility: ["public", "private"],
      gender: ["male", "female", "other"],
      id_status: ["none", "pending", "verified", "rejected"],
      id_type: ["cnic", "passport"],
      participant_status: ["invited", "confirmed", "declined"],
      pass_kind: ["pack", "monthly"],
      pass_status: [
        "awaiting_payment",
        "payment_submitted",
        "active",
        "exhausted",
        "expired",
        "cancelled",
        "rejected",
      ],
      payment_method: ["bank", "jazzcash", "easypaisa", "other"],
      product_kind: ["pass_purchase", "class_booking", "space_booking"],
      registration_mode: ["open", "approval"],
      registration_source: ["self", "invited", "manual"],
      registration_status: [
        "requested",
        "awaiting_payment",
        "payment_submitted",
        "confirmed",
        "checked_in",
        "rejected",
        "cancelled",
        "waitlisted",
        "no_show",
      ],
      retreat_item_kind: [
        "activity",
        "meal",
        "transport",
        "stay",
        "session",
        "free_time",
        "milestone",
      ],
      retreat_item_status: [
        "planned",
        "confirmed",
        "in_progress",
        "done",
        "skipped",
      ],
      retreat_status: [
        "planning",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      review_status: ["submitted", "approved", "rejected"],
      scan_kind: ["class", "space", "retreat"],
      scan_result: [
        "admitted",
        "duplicate",
        "not_approved",
        "wrong_day",
        "invalid",
      ],
      score_tier: ["new", "reliable", "regular", "trusted"],
      series_status: ["draft", "published", "paused", "ended"],
      session_status: ["scheduled", "cancelled", "completed"],
      space_kind: ["room", "court", "studio", "desk", "table", "other"],
      space_status: ["draft", "published", "paused"],
      subscription_status: ["trial", "active", "grace", "expired", "cancelled"],
      team_role: ["manager"],
      user_role: ["organizer", "attendee", "admin"],
    },
  },
} as const
