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
      artist_enquiries: {
        Row: {
          additional_notes: string | null
          artist_id: string
          booked_at: string | null
          created_at: string
          decline_reason: string | null
          declined_at: string | null
          estimated_attendance: string
          event_city: string
          event_date: string
          event_name: string
          event_type: string
          event_venue: string | null
          expires_at: string
          id: string
          management_id: string
          organiser_id: string
          performance_duration: string
          responded_at: string | null
          set_type: string | null
          status: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          artist_id: string
          booked_at?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          estimated_attendance: string
          event_city: string
          event_date: string
          event_name: string
          event_type: string
          event_venue?: string | null
          expires_at?: string
          id?: string
          management_id: string
          organiser_id: string
          performance_duration: string
          responded_at?: string | null
          set_type?: string | null
          status?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          artist_id?: string
          booked_at?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          estimated_attendance?: string
          event_city?: string
          event_date?: string
          event_name?: string
          event_type?: string
          event_venue?: string | null
          expires_at?: string
          id?: string
          management_id?: string
          organiser_id?: string
          performance_duration?: string
          responded_at?: string | null
          set_type?: string | null
          status?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_enquiries_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_enquiries_management_id_fkey"
            columns: ["management_id"]
            isOneToOne: false
            referencedRelation: "management_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_past_events: {
        Row: {
          artist_id: string
          city: string
          created_at: string
          event_date: string
          event_name: string
          id: string
          is_platform_event: boolean
          venue_name: string | null
        }
        Insert: {
          artist_id: string
          city: string
          created_at?: string
          event_date: string
          event_name: string
          id?: string
          is_platform_event?: boolean
          venue_name?: string | null
        }
        Update: {
          artist_id?: string
          city?: string
          created_at?: string
          event_date?: string
          event_name?: string
          id?: string
          is_platform_event?: boolean
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_past_events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          availability_status: string
          based_in_city: string | null
          bio: string | null
          category: string
          created_at: string
          event_types_accepted: string[]
          gallery_urls: string[]
          id: string
          management_id: string
          media_links: Json
          name: string
          press_kit_url: string | null
          profile_photo_url: string | null
          profile_status: string
          slug: string
          social_links: Json
          sub_tags: string[]
          updated_at: string
          verified: boolean
        }
        Insert: {
          availability_status?: string
          based_in_city?: string | null
          bio?: string | null
          category: string
          created_at?: string
          event_types_accepted?: string[]
          gallery_urls?: string[]
          id?: string
          management_id: string
          media_links?: Json
          name: string
          press_kit_url?: string | null
          profile_photo_url?: string | null
          profile_status?: string
          slug: string
          social_links?: Json
          sub_tags?: string[]
          updated_at?: string
          verified?: boolean
        }
        Update: {
          availability_status?: string
          based_in_city?: string | null
          bio?: string | null
          category?: string
          created_at?: string
          event_types_accepted?: string[]
          gallery_urls?: string[]
          id?: string
          management_id?: string
          media_links?: Json
          name?: string
          press_kit_url?: string | null
          profile_photo_url?: string | null
          profile_status?: string
          slug?: string
          social_links?: Json
          sub_tags?: string[]
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "artists_management_id_fkey"
            columns: ["management_id"]
            isOneToOne: false
            referencedRelation: "management_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
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
      cross_hires: {
        Row: {
          cost: number
          created_at: string
          deal_id: string
          description: string | null
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["cross_hire_payment_status"]
          supplier_contact: string | null
          supplier_name: string
          supplier_user_id: string | null
          type: Database["public"]["Enums"]["cross_hire_type"]
          vendor_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          deal_id: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["cross_hire_payment_status"]
          supplier_contact?: string | null
          supplier_name: string
          supplier_user_id?: string | null
          type?: Database["public"]["Enums"]["cross_hire_type"]
          vendor_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          deal_id?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["cross_hire_payment_status"]
          supplier_contact?: string | null
          supplier_name?: string
          supplier_user_id?: string | null
          type?: Database["public"]["Enums"]["cross_hire_type"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_hires_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_hires_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          client_contact: string | null
          client_name: string
          created_at: string
          event_date: string | null
          event_location: string | null
          event_name: string
          event_type: Database["public"]["Enums"]["event_type_tag"]
          id: string
          linked_event_id: string | null
          notes: string | null
          quote_value: number
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string
          vendor_id: string
          won_lost_at: string | null
        }
        Insert: {
          client_contact?: string | null
          client_name: string
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          event_name: string
          event_type?: Database["public"]["Enums"]["event_type_tag"]
          id?: string
          linked_event_id?: string | null
          notes?: string | null
          quote_value?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
          vendor_id: string
          won_lost_at?: string | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          event_name?: string
          event_type?: Database["public"]["Enums"]["event_type_tag"]
          id?: string
          linked_event_id?: string | null
          notes?: string | null
          quote_value?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
          vendor_id?: string
          won_lost_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
          admin_status: string | null
          budget: number | null
          capacity: number
          category_id: string | null
          city: string | null
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
          admin_status?: string | null
          budget?: number | null
          capacity?: number
          category_id?: string | null
          city?: string | null
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
          admin_status?: string | null
          budget?: number | null
          capacity?: number
          category_id?: string | null
          city?: string | null
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
      invoices: {
        Row: {
          advance_amount: number | null
          advance_confirmed_at: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          deal_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          line_items: Json
          notes: string | null
          paid_in_full_at: string | null
          payment_instructions: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number | null
          total: number
          vendor_id: string
        }
        Insert: {
          advance_amount?: number | null
          advance_confirmed_at?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          line_items?: Json
          notes?: string | null
          paid_in_full_at?: string | null
          payment_instructions?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number | null
          total?: number
          vendor_id: string
        }
        Update: {
          advance_amount?: number | null
          advance_confirmed_at?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          line_items?: Json
          notes?: string | null
          paid_in_full_at?: string | null
          payment_instructions?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number | null
          total?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      management_accounts: {
        Row: {
          account_status: string
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          primary_contact_name: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          account_status?: string
          company_name: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          primary_contact_name?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          account_status?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          primary_contact_name?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      management_notifications: {
        Row: {
          artist_id: string | null
          created_at: string
          enquiry_id: string | null
          id: string
          management_id: string
          read: boolean
          type: string
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          enquiry_id?: string | null
          id?: string
          management_id: string
          read?: boolean
          type: string
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          enquiry_id?: string | null
          id?: string
          management_id?: string
          read?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_notifications_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_notifications_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "artist_enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_notifications_management_id_fkey"
            columns: ["management_id"]
            isOneToOne: false
            referencedRelation: "management_accounts"
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
          type: string
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
          type: string
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
          type?: string
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
      organiser_vendor_contacts: {
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
      organiser_vendor_invoices: {
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
            referencedRelation: "organiser_vendor_contacts"
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
          city: string | null
          cnic_expiry: string | null
          cnic_image_url: string | null
          cnic_number: string | null
          cnic_reject_reason: string | null
          cnic_status: string | null
          cnic_submitted_at: string | null
          company_name: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          didit_verification_id: string | null
          email: string
          full_name: string
          id: string
          id_type: string | null
          is_id_verified: boolean
          is_payment_verified: boolean
          logo_url: string | null
          notification_preferences: Json
          passport_number: string | null
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
          city?: string | null
          cnic_expiry?: string | null
          cnic_image_url?: string | null
          cnic_number?: string | null
          cnic_reject_reason?: string | null
          cnic_status?: string | null
          cnic_submitted_at?: string | null
          company_name?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          didit_verification_id?: string | null
          email: string
          full_name: string
          id: string
          id_type?: string | null
          is_id_verified?: boolean
          is_payment_verified?: boolean
          logo_url?: string | null
          notification_preferences?: Json
          passport_number?: string | null
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
          city?: string | null
          cnic_expiry?: string | null
          cnic_image_url?: string | null
          cnic_number?: string | null
          cnic_reject_reason?: string | null
          cnic_status?: string | null
          cnic_submitted_at?: string | null
          company_name?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          didit_verification_id?: string | null
          email?: string
          full_name?: string
          id?: string
          id_type?: string | null
          is_id_verified?: boolean
          is_payment_verified?: boolean
          logo_url?: string | null
          notification_preferences?: Json
          passport_number?: string | null
          payment_method_token?: string | null
          phone_number?: string | null
          role?: string
          social_score?: number
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      programme_instances: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          programme_id: string
          status: Database["public"]["Enums"]["programme_instance_status"]
          tickets_sold: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          programme_id: string
          status?: Database["public"]["Enums"]["programme_instance_status"]
          tickets_sold?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          programme_id?: string
          status?: Database["public"]["Enums"]["programme_instance_status"]
          tickets_sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "programme_instances_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_registrations: {
        Row: {
          created_at: string
          currency: string
          guest_count: number
          guest_name: string
          guest_phone: string | null
          id: string
          instance_id: string | null
          notes: string | null
          programme_id: string
          qr_token: string | null
          status: Database["public"]["Enums"]["programme_reg_status"]
          total_price: number
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          guest_count?: number
          guest_name: string
          guest_phone?: string | null
          id?: string
          instance_id?: string | null
          notes?: string | null
          programme_id: string
          qr_token?: string | null
          status?: Database["public"]["Enums"]["programme_reg_status"]
          total_price?: number
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          guest_count?: number
          guest_name?: string
          guest_phone?: string | null
          id?: string
          instance_id?: string | null
          notes?: string | null
          programme_id?: string
          qr_token?: string | null
          status?: Database["public"]["Enums"]["programme_reg_status"]
          total_price?: number
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_registrations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "programme_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_registrations_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_registrations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      programmes: {
        Row: {
          active: boolean
          capacity: number
          category: string
          cover_image: string | null
          created_at: string
          currency: string
          description: string | null
          duration_mins: number
          id: string
          price: number
          rrule: string | null
          spot_booking_enabled: boolean
          start_time: string
          tags: string[]
          title: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          category?: string
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_mins?: number
          id?: string
          price?: number
          rrule?: string | null
          spot_booking_enabled?: boolean
          start_time: string
          tags?: string[]
          title: string
          venue_id: string
        }
        Update: {
          active?: boolean
          capacity?: number
          category?: string
          cover_image?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_mins?: number
          id?: string
          price?: number
          rrule?: string | null
          spot_booking_enabled?: boolean
          start_time?: string
          tags?: string[]
          title?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
          reference_code_entered: string | null
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
          reference_code_entered?: string | null
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
          reference_code_entered?: string | null
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
      resources: {
        Row: {
          active: boolean
          active_days: number[]
          buffer_mins: number
          capacity: number
          close_time: string
          created_at: string
          currency: string
          description: string | null
          duration_unit_mins: number
          id: string
          max_advance_days: number
          min_notice_hours: number
          name: string
          open_time: string
          photos: string[]
          price_per_slot: number
          resource_type: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          active_days?: number[]
          buffer_mins?: number
          capacity?: number
          close_time?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_unit_mins?: number
          id?: string
          max_advance_days?: number
          min_notice_hours?: number
          name: string
          open_time?: string
          photos?: string[]
          price_per_slot?: number
          resource_type?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          active_days?: number[]
          buffer_mins?: number
          capacity?: number
          close_time?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_unit_mins?: number
          id?: string
          max_advance_days?: number
          min_notice_hours?: number
          name?: string
          open_time?: string
          photos?: string[]
          price_per_slot?: number
          resource_type?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
      slot_bookings: {
        Row: {
          created_at: string
          currency: string
          date: string
          duration_mins: number
          end_time: string
          guest_count: number
          id: string
          notes: string | null
          qr_token: string | null
          resource_id: string
          start_time: string
          status: Database["public"]["Enums"]["slot_booking_status"]
          total_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          date: string
          duration_mins: number
          end_time: string
          guest_count?: number
          id?: string
          notes?: string | null
          qr_token?: string | null
          resource_id: string
          start_time: string
          status?: Database["public"]["Enums"]["slot_booking_status"]
          total_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          date?: string
          duration_mins?: number
          end_time?: string
          guest_count?: number
          id?: string
          notes?: string | null
          qr_token?: string | null
          resource_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["slot_booking_status"]
          total_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_bookings: {
        Row: {
          created_at: string
          id: string
          instance_id: string | null
          party_size: number
          slot_booking_id: string | null
          spot_id: string
          spot_map_id: string
          status: string
          surcharge: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_id?: string | null
          party_size?: number
          slot_booking_id?: string | null
          spot_id: string
          spot_map_id: string
          status?: string
          surcharge?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_id?: string | null
          party_size?: number
          slot_booking_id?: string | null
          spot_id?: string
          spot_map_id?: string
          status?: string
          surcharge?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_bookings_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "programme_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_bookings_slot_booking_id_fkey"
            columns: ["slot_booking_id"]
            isOneToOne: false
            referencedRelation: "slot_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_bookings_spot_map_id_fkey"
            columns: ["spot_map_id"]
            isOneToOne: false
            referencedRelation: "spot_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_maps: {
        Row: {
          active: boolean
          canvas_height: number
          canvas_width: number
          created_at: string
          id: string
          layout_json: Json
          name: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          canvas_height?: number
          canvas_width?: number
          created_at?: string
          id?: string
          layout_json?: Json
          name?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          canvas_height?: number
          canvas_width?: number
          created_at?: string
          id?: string
          layout_json?: Json
          name?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_maps_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_by_admin: boolean | null
          read_by_user: boolean | null
          sender: string
          user_id: string
          user_name: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_by_admin?: boolean | null
          read_by_user?: boolean | null
          sender?: string
          user_id: string
          user_name: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_by_admin?: boolean | null
          read_by_user?: boolean | null
          sender?: string
          user_id?: string
          user_name?: string
          user_type?: string
        }
        Relationships: []
      }
      support_queries: {
        Row: {
          body: string | null
          category: string | null
          created_at: string | null
          from_id: string | null
          from_name: string
          from_type: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
        }
        Insert: {
          body?: string | null
          category?: string | null
          created_at?: string | null
          from_id?: string | null
          from_name: string
          from_type: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          body?: string | null
          category?: string | null
          created_at?: string | null
          from_id?: string | null
          from_name?: string
          from_type?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_queries_from_id_fkey"
            columns: ["from_id"]
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
      vendor_bills: {
        Row: {
          bill_number: string | null
          created_at: string
          cross_hire_id: string | null
          deal_id: string | null
          due_date: string | null
          id: string
          issue_date: string
          line_items: Json
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["bill_status"]
          subtotal: number
          supplier_email: string | null
          supplier_name: string
          supplier_phone: string | null
          tax: number | null
          total: number
          vendor_id: string
        }
        Insert: {
          bill_number?: string | null
          created_at?: string
          cross_hire_id?: string | null
          deal_id?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          subtotal?: number
          supplier_email?: string | null
          supplier_name: string
          supplier_phone?: string | null
          tax?: number | null
          total?: number
          vendor_id: string
        }
        Update: {
          bill_number?: string | null
          created_at?: string
          cross_hire_id?: string | null
          deal_id?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          subtotal?: number
          supplier_email?: string | null
          supplier_name?: string
          supplier_phone?: string | null
          tax?: number | null
          total?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bills_cross_hire_id_fkey"
            columns: ["cross_hire_id"]
            isOneToOne: false
            referencedRelation: "cross_hires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bills_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_inventory: {
        Row: {
          available_quantity: number
          category: string
          condition: string
          created_at: string
          daily_hire_rate: number | null
          description: string | null
          id: string
          name: string
          notes: string | null
          purchase_value: number | null
          quantity: number
          vendor_id: string
        }
        Insert: {
          available_quantity?: number
          category?: string
          condition?: string
          created_at?: string
          daily_hire_rate?: number | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          purchase_value?: number | null
          quantity?: number
          vendor_id: string
        }
        Update: {
          available_quantity?: number
          category?: string
          condition?: string
          created_at?: string
          daily_hire_rate?: number | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          purchase_value?: number | null
          quantity?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_inventory_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_reviews: {
        Row: {
          body: string
          created_at: string
          event_type: string | null
          id: string
          rating: number
          response: string | null
          response_at: string | null
          reviewer_id: string
          reviewer_name: string
          title: string | null
          vendor_id: string
        }
        Insert: {
          body: string
          created_at?: string
          event_type?: string | null
          id?: string
          rating: number
          response?: string | null
          response_at?: string | null
          reviewer_id: string
          reviewer_name: string
          title?: string | null
          vendor_id: string
        }
        Update: {
          body?: string
          created_at?: string
          event_type?: string | null
          id?: string
          rating?: number
          response?: string | null
          response_at?: string | null
          reviewer_id?: string
          reviewer_name?: string
          title?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          active: boolean
          bio: string | null
          category: string
          cities_covered: string[] | null
          company_name: string | null
          created_at: string
          id: string
          instagram_handle: string | null
          logo_url: string | null
          portfolio_urls: string[] | null
          sub_types: string[] | null
          trading_name: string
          user_id: string
          username: string | null
          verification_tier: number
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          category: string
          cities_covered?: string[] | null
          company_name?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          logo_url?: string | null
          portfolio_urls?: string[] | null
          sub_types?: string[] | null
          trading_name: string
          user_id: string
          username?: string | null
          verification_tier?: number
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          category?: string
          cities_covered?: string[] | null
          company_name?: string | null
          created_at?: string
          id?: string
          instagram_handle?: string | null
          logo_url?: string | null
          portfolio_urls?: string[] | null
          sub_types?: string[] | null
          trading_name?: string
          user_id?: string
          username?: string | null
          verification_tier?: number
          verified_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      venue_enquiries: {
        Row: {
          created_at: string
          guest_id: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          message: string
          programme_id: string | null
          replied_at: string | null
          reply: string | null
          resource_id: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          venue_id: string
        }
        Insert: {
          created_at?: string
          guest_id?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          message: string
          programme_id?: string | null
          replied_at?: string | null
          reply?: string | null
          resource_id?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          venue_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          message?: string
          programme_id?: string | null
          replied_at?: string | null
          reply?: string | null
          resource_id?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_enquiries_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_enquiries_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_enquiries_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          active: boolean
          address: string | null
          capacity: number | null
          categories: Database["public"]["Enums"]["venue_category"][]
          city: string
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          lat: number | null
          lng: number | null
          name: string
          owner_id: string
          phone: string | null
          photos: string[]
          slug: string
          verified: boolean
          website: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          capacity?: number | null
          categories?: Database["public"]["Enums"]["venue_category"][]
          city: string
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          owner_id: string
          phone?: string | null
          photos?: string[]
          slug: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          capacity?: number | null
          categories?: Database["public"]["Enums"]["venue_category"][]
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          photos?: string[]
          slug?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
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
      verifications: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          status: string
          tier: number
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          status?: string
          tier?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          status?: string
          tier?: number
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
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
      bill_status: "pending" | "paid" | "overdue" | "disputed"
      cross_hire_payment_status: "pending" | "partially_paid" | "paid"
      cross_hire_type:
        | "sub_contractor"
        | "equipment_rental"
        | "transport"
        | "other"
      deal_stage:
        | "new_inquiry"
        | "quote_sent"
        | "negotiating"
        | "deposit_confirmed"
        | "confirmed"
        | "event_day"
        | "fulfilled"
        | "lost"
      enquiry_status: "new" | "read" | "replied" | "archived"
      event_type_tag:
        | "wedding"
        | "corporate"
        | "concert"
        | "festival"
        | "private"
        | "other"
      invoice_status:
        | "draft"
        | "sent"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      notification_type:
        | "guest_signup"
        | "guest_cancellation"
        | "entry_scan"
        | "exit_scan"
        | "vendor_payment_due"
        | "event_going_live"
        | "event_ended"
      programme_instance_status:
        | "scheduled"
        | "live"
        | "cancelled"
        | "completed"
      programme_reg_status: "pending" | "confirmed" | "cancelled" | "attended"
      resource_duration_unit: "30" | "60" | "90" | "120"
      slot_booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      venue_category:
        | "studio"
        | "court"
        | "hall"
        | "rooftop"
        | "garden"
        | "restaurant"
        | "cafe"
        | "coworking"
        | "gym"
        | "pool"
        | "theatre"
        | "gallery"
        | "other"
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
      bill_status: ["pending", "paid", "overdue", "disputed"],
      cross_hire_payment_status: ["pending", "partially_paid", "paid"],
      cross_hire_type: [
        "sub_contractor",
        "equipment_rental",
        "transport",
        "other",
      ],
      deal_stage: [
        "new_inquiry",
        "quote_sent",
        "negotiating",
        "deposit_confirmed",
        "confirmed",
        "event_day",
        "fulfilled",
        "lost",
      ],
      enquiry_status: ["new", "read", "replied", "archived"],
      event_type_tag: [
        "wedding",
        "corporate",
        "concert",
        "festival",
        "private",
        "other",
      ],
      invoice_status: [
        "draft",
        "sent",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      notification_type: [
        "guest_signup",
        "guest_cancellation",
        "entry_scan",
        "exit_scan",
        "vendor_payment_due",
        "event_going_live",
        "event_ended",
      ],
      programme_instance_status: [
        "scheduled",
        "live",
        "cancelled",
        "completed",
      ],
      programme_reg_status: ["pending", "confirmed", "cancelled", "attended"],
      resource_duration_unit: ["30", "60", "90", "120"],
      slot_booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      venue_category: [
        "studio",
        "court",
        "hall",
        "rooftop",
        "garden",
        "restaurant",
        "cafe",
        "coworking",
        "gym",
        "pool",
        "theatre",
        "gallery",
        "other",
      ],
    },
  },
} as const
