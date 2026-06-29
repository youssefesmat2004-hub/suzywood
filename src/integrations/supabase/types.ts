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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          contact_method: Database["public"]["Enums"]["booking_contact_method"]
          created_at: string
          customer_email: string | null
          customer_notification_sent_at: string | null
          full_name: string
          id: string
          notes: string | null
          owner_notification_sent_at: string | null
          phone: string
          preferred_day: Database["public"]["Enums"]["booking_day"]
          status: Database["public"]["Enums"]["booking_status"]
          time_slot: Database["public"]["Enums"]["booking_time_slot"]
          updated_at: string
        }
        Insert: {
          contact_method: Database["public"]["Enums"]["booking_contact_method"]
          created_at?: string
          customer_email?: string | null
          customer_notification_sent_at?: string | null
          full_name: string
          id?: string
          notes?: string | null
          owner_notification_sent_at?: string | null
          phone: string
          preferred_day: Database["public"]["Enums"]["booking_day"]
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot: Database["public"]["Enums"]["booking_time_slot"]
          updated_at?: string
        }
        Update: {
          contact_method?: Database["public"]["Enums"]["booking_contact_method"]
          created_at?: string
          customer_email?: string | null
          customer_notification_sent_at?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          owner_notification_sent_at?: string | null
          phone?: string
          preferred_day?: Database["public"]["Enums"]["booking_day"]
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot?: Database["public"]["Enums"]["booking_time_slot"]
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          custom_size_enabled: boolean
          custom_size_note: string | null
          custom_size_surcharge: number
          description: string | null
          finish_label: string | null
          id: string
          image_url: string | null
          mattress_addon_enabled: boolean
          mattress_addon_note: string | null
          mattress_big_price: number
          mattress_small_price: number
          name: string
          name_engraving_enabled: boolean
          name_engraving_note: string | null
          name_engraving_surcharge: number
          ottoman_addon_enabled: boolean
          ottoman_addon_note: string | null
          ottoman_addon_price: number
          portable_changing_table_enabled: boolean
          portable_changing_table_note: string | null
          portable_changing_table_price: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          custom_size_enabled?: boolean
          custom_size_note?: string | null
          custom_size_surcharge?: number
          description?: string | null
          finish_label?: string | null
          id?: string
          image_url?: string | null
          mattress_addon_enabled?: boolean
          mattress_addon_note?: string | null
          mattress_big_price?: number
          mattress_small_price?: number
          name: string
          name_engraving_enabled?: boolean
          name_engraving_note?: string | null
          name_engraving_surcharge?: number
          ottoman_addon_enabled?: boolean
          ottoman_addon_note?: string | null
          ottoman_addon_price?: number
          portable_changing_table_enabled?: boolean
          portable_changing_table_note?: string | null
          portable_changing_table_price?: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          custom_size_enabled?: boolean
          custom_size_note?: string | null
          custom_size_surcharge?: number
          description?: string | null
          finish_label?: string | null
          id?: string
          image_url?: string | null
          mattress_addon_enabled?: boolean
          mattress_addon_note?: string | null
          mattress_big_price?: number
          mattress_small_price?: number
          name?: string
          name_engraving_enabled?: boolean
          name_engraving_note?: string | null
          name_engraving_surcharge?: number
          ottoman_addon_enabled?: boolean
          ottoman_addon_note?: string | null
          ottoman_addon_price?: number
          portable_changing_table_enabled?: boolean
          portable_changing_table_note?: string | null
          portable_changing_table_price?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      category_sizes: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          mattress_tier: string | null
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          mattress_tier?: string | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          mattress_tier?: string | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_sizes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_read: boolean
          message: string
          owner_notification_sent_at: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_read?: boolean
          message: string
          owner_notification_sent_at?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_read?: boolean
          message?: string
          owner_notification_sent_at?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      custom_build_requests: {
        Row: {
          accepted_email_sent_at: string | null
          created_at: string
          customer_notification_sent_at: string | null
          description: string
          email: string
          full_name: string
          id: string
          inspiration_image_url: string | null
          owner_notification_sent_at: string | null
          phone: string
          rejected_email_sent_at: string | null
          room_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_email_sent_at?: string | null
          created_at?: string
          customer_notification_sent_at?: string | null
          description: string
          email: string
          full_name: string
          id?: string
          inspiration_image_url?: string | null
          owner_notification_sent_at?: string | null
          phone: string
          rejected_email_sent_at?: string | null
          room_type: string
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_email_sent_at?: string | null
          created_at?: string
          customer_notification_sent_at?: string | null
          description?: string
          email?: string
          full_name?: string
          id?: string
          inspiration_image_url?: string | null
          owner_notification_sent_at?: string | null
          phone?: string
          rejected_email_sent_at?: string | null
          room_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      instapay_qr_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          changed_by_email: string | null
          id: string
          new_url: string | null
          previous_url: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          changed_by_email?: string | null
          id?: string
          new_url?: string | null
          previous_url?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          changed_by_email?: string | null
          id?: string
          new_url?: string | null
          previous_url?: string | null
        }
        Relationships: []
      }
      measurement_bookings: {
        Row: {
          address: string
          area: string
          booking_status: string
          confirmed_date: string | null
          confirmed_email_sent_at: string | null
          created_at: string
          customer_email: string | null
          customer_notification_sent_at: string | null
          full_name: string
          id: string
          notes: string | null
          owner_notification_sent_at: string | null
          payment_email_sent_at: string | null
          payment_link: string | null
          phone: string
          preferred_day: string
          product_id: string | null
          product_name: string
          quotation_email_sent_at: string | null
          quotation_price: number | null
          quoted_price: number | null
          received_email_sent_at: string | null
          status: Database["public"]["Enums"]["measurement_booking_status"]
          time_slot: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          area: string
          booking_status?: string
          confirmed_date?: string | null
          confirmed_email_sent_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_notification_sent_at?: string | null
          full_name: string
          id?: string
          notes?: string | null
          owner_notification_sent_at?: string | null
          payment_email_sent_at?: string | null
          payment_link?: string | null
          phone: string
          preferred_day: string
          product_id?: string | null
          product_name: string
          quotation_email_sent_at?: string | null
          quotation_price?: number | null
          quoted_price?: number | null
          received_email_sent_at?: string | null
          status?: Database["public"]["Enums"]["measurement_booking_status"]
          time_slot: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          area?: string
          booking_status?: string
          confirmed_date?: string | null
          confirmed_email_sent_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_notification_sent_at?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          owner_notification_sent_at?: string | null
          payment_email_sent_at?: string | null
          payment_link?: string | null
          phone?: string
          preferred_day?: string
          product_id?: string | null
          product_name?: string
          quotation_email_sent_at?: string | null
          quotation_price?: number | null
          quoted_price?: number | null
          received_email_sent_at?: string | null
          status?: Database["public"]["Enums"]["measurement_booking_status"]
          time_slot?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          owner_notification_sent_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          owner_notification_sent_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          owner_notification_sent_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          bed_rails: boolean
          bed_rails_price: number
          custom_length_cm: number | null
          custom_surcharge: number | null
          custom_width_cm: number | null
          engraving: string | null
          finish: string | null
          id: string
          line_total: number
          mattress: boolean
          mattress_price: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          unit_price: number
        }
        Insert: {
          bed_rails?: boolean
          bed_rails_price?: number
          custom_length_cm?: number | null
          custom_surcharge?: number | null
          custom_width_cm?: number | null
          engraving?: string | null
          finish?: string | null
          id?: string
          line_total: number
          mattress?: boolean
          mattress_price?: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          size?: string | null
          unit_price: number
        }
        Update: {
          bed_rails?: boolean
          bed_rails_price?: number
          custom_length_cm?: number | null
          custom_surcharge?: number | null
          custom_width_cm?: number | null
          engraving?: string | null
          finish?: string | null
          id?: string
          line_total?: number
          mattress?: boolean
          mattress_price?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_carpenter_cost: number | null
          assigned_carpenter: number | null
          attachments: Json
          carpenter_cost_override: number | null
          carpenter_paid_at: string | null
          carpenter_payment_status: string | null
          confirmation_email_sent_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_area: string | null
          delivery_cost: number | null
          delivery_notes: string | null
          deposit_amount: number | null
          discount_amount: number | null
          discount_code: string | null
          id: string
          instapay_reference: string | null
          internal_notes: string | null
          is_manual_order: boolean
          last_updated_at: string | null
          notes: string | null
          notified_statuses: Json
          order_number: string
          order_size_type: string | null
          owner_notification_sent_at: string | null
          payment_method: string | null
          payment_proof_path: string | null
          payment_proof_url: string | null
          payment_status: string | null
          product_description: string | null
          promo_code: string | null
          remaining_amount: number | null
          shipping_address: string
          shipping_city: string
          shipping_fee: number
          shipping_governorate: string
          shipping_notes: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          total_amount: number | null
          transaction_id: string | null
          update_notified_at: string | null
          updated_at: string
          upfront_amount: number | null
          user_id: string | null
        }
        Insert: {
          actual_carpenter_cost?: number | null
          assigned_carpenter?: number | null
          attachments?: Json
          carpenter_cost_override?: number | null
          carpenter_paid_at?: string | null
          carpenter_payment_status?: string | null
          confirmation_email_sent_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_area?: string | null
          delivery_cost?: number | null
          delivery_notes?: string | null
          deposit_amount?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          instapay_reference?: string | null
          internal_notes?: string | null
          is_manual_order?: boolean
          last_updated_at?: string | null
          notes?: string | null
          notified_statuses?: Json
          order_number?: string
          order_size_type?: string | null
          owner_notification_sent_at?: string | null
          payment_method?: string | null
          payment_proof_path?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          product_description?: string | null
          promo_code?: string | null
          remaining_amount?: number | null
          shipping_address: string
          shipping_city: string
          shipping_fee?: number
          shipping_governorate: string
          shipping_notes?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_amount?: number | null
          transaction_id?: string | null
          update_notified_at?: string | null
          updated_at?: string
          upfront_amount?: number | null
          user_id?: string | null
        }
        Update: {
          actual_carpenter_cost?: number | null
          assigned_carpenter?: number | null
          attachments?: Json
          carpenter_cost_override?: number | null
          carpenter_paid_at?: string | null
          carpenter_payment_status?: string | null
          confirmation_email_sent_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_area?: string | null
          delivery_cost?: number | null
          delivery_notes?: string | null
          deposit_amount?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          instapay_reference?: string | null
          internal_notes?: string | null
          is_manual_order?: boolean
          last_updated_at?: string | null
          notes?: string | null
          notified_statuses?: Json
          order_number?: string
          order_size_type?: string | null
          owner_notification_sent_at?: string | null
          payment_method?: string | null
          payment_proof_path?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          product_description?: string | null
          promo_code?: string | null
          remaining_amount?: number | null
          shipping_address?: string
          shipping_city?: string
          shipping_fee?: number
          shipping_governorate?: string
          shipping_notes?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_amount?: number | null
          transaction_id?: string | null
          update_notified_at?: string | null
          updated_at?: string
          upfront_amount?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          carpenter_cost: number | null
          color_hex: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          product_id: string
          sort_order: number
          stock_quantity: number
          updated_at: string
          variant_type: string
        }
        Insert: {
          carpenter_cost?: number | null
          color_hex?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          product_id: string
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
          variant_type?: string
        }
        Update: {
          carpenter_cost?: number | null
          color_hex?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          product_id?: string
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          care_info: string | null
          carpenter_cost: number | null
          category_id: string
          created_at: string
          description: string | null
          finishes: Json
          gallery: Json
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          lead_time_weeks: number
          materials: string | null
          name: string
          portable_changing_table_enabled: boolean | null
          safety_info: string | null
          sizes: Json
          slug: string
          starting_price: number
          stock_quantity: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          care_info?: string | null
          carpenter_cost?: number | null
          category_id: string
          created_at?: string
          description?: string | null
          finishes?: Json
          gallery?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          lead_time_weeks?: number
          materials?: string | null
          name: string
          portable_changing_table_enabled?: boolean | null
          safety_info?: string | null
          sizes?: Json
          slug: string
          starting_price: number
          stock_quantity?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          care_info?: string | null
          carpenter_cost?: number | null
          category_id?: string
          created_at?: string
          description?: string | null
          finishes?: Json
          gallery?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          lead_time_weeks?: number
          materials?: string | null
          name?: string
          portable_changing_table_enabled?: boolean | null
          safety_info?: string | null
          sizes?: Json
          slug?: string
          starting_price?: number
          stock_quantity?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_subtotal: number
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_subtotal?: number
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["promo_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_subtotal?: number
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_published: boolean
          owner_notification_sent_at: string | null
          product_id: string
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          owner_notification_sent_at?: string | null
          product_id: string
          rating: number
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          owner_notification_sent_at?: string | null
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_with_items:
        | {
            Args: {
              _details: Json
              _instapay_reference: string
              _items: Json
              _payment_proof_path: string
              _promo_code: string
              _upfront_rate: number
            }
            Returns: {
              id: string
              order_number: string
            }[]
          }
        | {
            Args: {
              _delivery_area?: string
              _details: Json
              _instapay_reference: string
              _items: Json
              _order_size_type?: string
              _payment_proof_path: string
              _promo_code: string
              _upfront_rate: number
            }
            Returns: {
              id: string
              order_number: string
            }[]
          }
      get_carpenter_owed_orders: {
        Args: { _carpenter_id: number }
        Returns: {
          carpenter_cost: number
          created_at: string
          order_id: string
          order_number: string
          paid_at: string
          payment_status: string
          product_summary: string
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_promo_usage: { Args: { _promo_id: string }; Returns: undefined }
      lookup_order_for_tracking: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          created_at: string
          customer_name: string
          id: string
          order_number: string
          remaining_amount: number
          shipping_city: string
          shipping_fee: number
          shipping_governorate: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          upfront_amount: number
        }[]
      }
      validate_promo_code: {
        Args: { _code: string; _subtotal: number }
        Returns: {
          code: string
          discount_amount: number
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "carpenter"
      booking_contact_method: "whatsapp" | "phone"
      booking_day:
        | "saturday"
        | "sunday"
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
      booking_status: "new" | "contacted" | "done"
      booking_time_slot: "morning" | "afternoon" | "evening"
      measurement_booking_status:
        | "new"
        | "contacted"
        | "visited"
        | "quoted"
        | "ordered"
        | "cancelled"
      order_status:
        | "pending_payment"
        | "confirmed"
        | "in_production"
        | "shipped"
        | "delivered"
        | "cancelled"
      promo_discount_type: "percent" | "fixed"
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
      app_role: ["admin", "customer", "carpenter"],
      booking_contact_method: ["whatsapp", "phone"],
      booking_day: [
        "saturday",
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
      ],
      booking_status: ["new", "contacted", "done"],
      booking_time_slot: ["morning", "afternoon", "evening"],
      measurement_booking_status: [
        "new",
        "contacted",
        "visited",
        "quoted",
        "ordered",
        "cancelled",
      ],
      order_status: [
        "pending_payment",
        "confirmed",
        "in_production",
        "shipped",
        "delivered",
        "cancelled",
      ],
      promo_discount_type: ["percent", "fixed"],
    },
  },
} as const
