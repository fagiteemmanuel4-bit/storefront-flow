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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      account_security_settings: {
        Row: {
          rate_limit_profile: string
          security_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          rate_limit_profile?: string
          security_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          rate_limit_profile?: string
          security_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: Json
          store_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: Json
          store_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: Json
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          paid_at: string | null
          plan_code: string
          provider: string
          provider_reference: string
          status: string
          store_id: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_code: string
          provider?: string
          provider_reference: string
          status?: string
          store_id: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_code?: string
          provider?: string
          provider_reference?: string
          status?: string
          store_id?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "store_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_stock: {
        Row: {
          branch_id: string
          product_id: string
          quantity: number
          store_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          product_id: string
          quantity?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          product_id?: string
          quantity?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "branch_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "branch_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_stock_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          store_id: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_store_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          status: string
          store_id: string
          updated_at: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          status?: string
          store_id: string
          updated_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          status?: string
          store_id?: string
          updated_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_store_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segment_members: {
        Row: {
          calculated_at: string
          customer_id: string
          segment_id: string
          store_id: string
        }
        Insert: {
          calculated_at?: string
          customer_id: string
          segment_id: string
          store_id: string
        }
        Update: {
          calculated_at?: string
          customer_id?: string
          segment_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segment_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segment_insights"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_segment_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          rules: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          rules?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          rules?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          last_visit_at: string | null
          name: string
          notes: string
          phone: string
          store_id: string
          total_spent: number
          updated_at: string
          visit_count: number
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          last_visit_at?: string | null
          name: string
          notes?: string
          phone?: string
          store_id: string
          total_spent?: number
          updated_at?: string
          visit_count?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_visit_at?: string | null
          name?: string
          notes?: string
          phone?: string
          store_id?: string
          total_spent?: number
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          minimum_order: number
          starts_at: string | null
          store_id: string
          type: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          minimum_order?: number
          starts_at?: string | null
          store_id: string
          type: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          minimum_order?: number
          starts_at?: string | null
          store_id?: string
          type?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      electronics_devices: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          imei: string | null
          notes: string
          product_id: string
          sale_item_id: string | null
          serial_number: string | null
          status: string
          store_id: string
          updated_at: string
          warranty_expires_at: string | null
          warranty_months: number
          warranty_started_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          imei?: string | null
          notes?: string
          product_id: string
          sale_item_id?: string | null
          serial_number?: string | null
          status?: string
          store_id: string
          updated_at?: string
          warranty_expires_at?: string | null
          warranty_months?: number
          warranty_started_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          imei?: string | null
          notes?: string
          product_id?: string
          sale_item_id?: string | null
          serial_number?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          warranty_expires_at?: string | null
          warranty_months?: number
          warranty_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "electronics_devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronics_devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segment_insights"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "electronics_devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronics_devices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "electronics_devices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "electronics_devices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronics_devices_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronics_devices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      electronics_repairs: {
        Row: {
          branch_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          device_id: string | null
          device_label: string
          device_previous_status: string | null
          diagnosis: string
          due_at: string | null
          estimated_cost: number
          final_cost: number
          id: string
          issue_description: string
          received_at: string
          status: string
          store_id: string
          updated_at: string
          warranty_claim: boolean
        }
        Insert: {
          branch_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          device_id?: string | null
          device_label: string
          device_previous_status?: string | null
          diagnosis?: string
          due_at?: string | null
          estimated_cost?: number
          final_cost?: number
          id?: string
          issue_description: string
          received_at?: string
          status?: string
          store_id: string
          updated_at?: string
          warranty_claim?: boolean
        }
        Update: {
          branch_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          device_id?: string | null
          device_label?: string
          device_previous_status?: string | null
          diagnosis?: string
          due_at?: string | null
          estimated_cost?: number
          final_cost?: number
          id?: string
          issue_description?: string
          received_at?: string
          status?: string
          store_id?: string
          updated_at?: string
          warranty_claim?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "electronics_repairs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronics_repairs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segment_insights"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "electronics_repairs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronics_repairs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "electronics_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronics_repairs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          provider_message_id: string | null
          store_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          provider_message_id?: string | null
          store_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          provider_message_id?: string | null
          store_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string | null
          category: string
          created_at: string
          created_by: string
          description: string
          expense_date: string
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          branch_id?: string | null
          category?: string
          created_at?: string
          created_by: string
          description?: string
          expense_date?: string
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      fashion_variant_stock: {
        Row: {
          branch_id: string
          color: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          size: string
          store_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          color?: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          size?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          color?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          size?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fashion_variant_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fashion_variant_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fashion_variant_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fashion_variant_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fashion_variant_stock_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      food_kitchen_ticket_items: {
        Row: {
          created_at: string
          id: string
          modifiers: Json
          order_notes: string
          product_name: string
          quantity: number
          sale_item_id: string
          store_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modifiers?: Json
          order_notes?: string
          product_name: string
          quantity: number
          sale_item_id: string
          store_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modifiers?: Json
          order_notes?: string
          product_name?: string
          quantity?: number
          sale_item_id?: string
          store_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_kitchen_ticket_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: true
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_kitchen_ticket_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_kitchen_ticket_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "food_kitchen_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      food_kitchen_tickets: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          notes: string
          sale_id: string
          status: string
          store_id: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          notes?: string
          sale_id: string
          status?: string
          store_id: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          notes?: string
          sale_id?: string
          status?: string
          store_id?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_kitchen_tickets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_kitchen_tickets_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_kitchen_tickets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      food_menu_modifiers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_required: boolean
          name: string
          options: Json
          product_id: string
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          name: string
          options?: Json
          product_id: string
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          name?: string
          options?: Json
          product_id?: string
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_menu_modifiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "food_menu_modifiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "food_menu_modifiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_menu_modifiers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      food_recipe_ingredients: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          ingredient_product_id: string
          menu_product_id: string
          quantity_per_serving: number
          store_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          ingredient_product_id: string
          menu_product_id: string
          quantity_per_serving: number
          store_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          ingredient_product_id?: string
          menu_product_id?: string
          quantity_per_serving?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_recipe_ingredients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_recipe_ingredients_ingredient_product_id_fkey"
            columns: ["ingredient_product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "food_recipe_ingredients_ingredient_product_id_fkey"
            columns: ["ingredient_product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "food_recipe_ingredients_ingredient_product_id_fkey"
            columns: ["ingredient_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_recipe_ingredients_menu_product_id_fkey"
            columns: ["menu_product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "food_recipe_ingredients_menu_product_id_fkey"
            columns: ["menu_product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "food_recipe_ingredients_menu_product_id_fkey"
            columns: ["menu_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_recipe_ingredients_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      food_waste_records: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          ingredient_product_id: string
          quantity: number
          reason: string
          recorded_by: string
          store_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          ingredient_product_id: string
          quantity: number
          reason: string
          recorded_by: string
          store_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          ingredient_product_id?: string
          quantity?: number
          reason?: string
          recorded_by?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_waste_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_waste_records_ingredient_product_id_fkey"
            columns: ["ingredient_product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "food_waste_records_ingredient_product_id_fkey"
            columns: ["ingredient_product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "food_waste_records_ingredient_product_id_fkey"
            columns: ["ingredient_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_waste_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_orders: {
        Row: {
          carrier: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          notes: string | null
          order_id: string
          shipping_address: Json
          status: string
          store_id: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipping_address?: Json
          status?: string
          store_id: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipping_address?: Json
          status?: string
          store_id?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          branch_id: string
          created_at: string
          current_quantity: number
          id: string
          product_id: string
          resolved_at: string | null
          status: string
          store_id: string
          suggested_quantity: number | null
          threshold: number | null
        }
        Insert: {
          alert_type: string
          branch_id: string
          created_at?: string
          current_quantity?: number
          id?: string
          product_id: string
          resolved_at?: string | null
          status?: string
          store_id: string
          suggested_quantity?: number | null
          threshold?: number | null
        }
        Update: {
          alert_type?: string
          branch_id?: string
          created_at?: string
          current_quantity?: number
          id?: string
          product_id?: string
          resolved_at?: string | null
          status?: string
          store_id?: string
          suggested_quantity?: number | null
          threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batch_allocations: {
        Row: {
          batch_id: string | null
          batch_number: string
          branch_id: string
          created_at: string
          expiry_date: string | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          sale_item_id: string
          store_id: string
        }
        Insert: {
          batch_id?: string | null
          batch_number: string
          branch_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          sale_item_id: string
          store_id: string
        }
        Update: {
          batch_id?: string | null
          batch_number?: string
          branch_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          sale_item_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batch_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batch_allocations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batch_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_batch_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_batch_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batch_allocations_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batch_allocations_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batch_allocations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          batch_number: string
          branch_id: string
          cost_per_unit: number
          created_by: string | null
          expiry_date: string | null
          id: string
          notes: string
          product_id: string
          quantity: number
          received_at: string
          status: string
          store_id: string
          supplier_name: string
          updated_at: string
        }
        Insert: {
          batch_number: string
          branch_id: string
          cost_per_unit?: number
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string
          product_id: string
          quantity?: number
          received_at?: string
          status?: string
          store_id: string
          supplier_name?: string
          updated_at?: string
        }
        Update: {
          batch_number?: string
          branch_id?: string
          cost_per_unit?: number
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string
          product_id?: string
          quantity?: number
          received_at?: string
          status?: string
          store_id?: string
          supplier_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_waste_records: {
        Row: {
          batch_id: string | null
          batch_number: string
          branch_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          reason: string
          recorded_by: string
          store_id: string
        }
        Insert: {
          batch_id?: string | null
          batch_number: string
          branch_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          reason: string
          recorded_by: string
          store_id: string
        }
        Update: {
          batch_id?: string | null
          batch_number?: string
          branch_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reason?: string
          recorded_by?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_waste_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_waste_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_waste_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_waste_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_waste_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_waste_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          lifetime_points: number
          points_balance: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segment_insights"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "loyalty_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          loyalty_account_id: string
          points: number
          reason: string
          reference: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          loyalty_account_id: string
          points: number
          reason: string
          reference?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          loyalty_account_id?: string
          points?: number
          reason?: string
          reference?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_loyalty_account_id_fkey"
            columns: ["loyalty_account_id"]
            isOneToOne: false
            referencedRelation: "loyalty_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          read_at: string | null
          store_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          store_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          store_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_batch_allocations: {
        Row: {
          batch_id: string | null
          batch_number: string
          branch_id: string
          created_at: string
          expiry_date: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          released_at: string | null
          store_id: string
        }
        Insert: {
          batch_id?: string | null
          batch_number: string
          branch_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          released_at?: string | null
          store_id: string
        }
        Update: {
          batch_id?: string | null
          batch_number?: string
          branch_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          released_at?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_order_batch_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_batch_allocations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_batch_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_batch_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_order_batch_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_order_batch_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_batch_allocations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          store_id: string
          unit_price: number
          variant_color: string | null
          variant_size: string | null
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          store_id: string
          unit_price: number
          variant_color?: string | null
          variant_size?: string | null
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          store_id?: string
          unit_price?: number
          variant_color?: string | null
          variant_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "online_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          order_id: string
          store_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          order_id: string
          store_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          order_id?: string
          store_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_status_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_stock_allocations: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          released_at: string | null
          store_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          released_at?: string | null
          store_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          released_at?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_order_stock_allocations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_stock_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_stock_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_order_stock_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_order_stock_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_stock_allocations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_order_variant_allocations: {
        Row: {
          branch_id: string
          created_at: string
          fashion_variant_stock_id: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          store_id: string
          variant_color: string
          variant_size: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          fashion_variant_stock_id?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity: number
          store_id: string
          variant_color: string
          variant_size: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          fashion_variant_stock_id?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          store_id?: string
          variant_color?: string
          variant_size?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_order_variant_allocations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_variant_allocations_fashion_variant_stock_id_fkey"
            columns: ["fashion_variant_stock_id"]
            isOneToOne: false
            referencedRelation: "fashion_variant_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_variant_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_variant_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_order_variant_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_order_variant_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_order_variant_allocations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_note: string
          customer_phone: string
          id: string
          online_store_id: string
          order_number: string
          payment_method: string
          shipping_address: string
          shipping_fee: number
          status: string
          store_id: string
          subtotal: number
          total: number
          tracking_token: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string
          customer_name: string
          customer_note?: string
          customer_phone: string
          id?: string
          online_store_id: string
          order_number: string
          payment_method?: string
          shipping_address: string
          shipping_fee?: number
          status?: string
          store_id: string
          subtotal: number
          total: number
          tracking_token?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_note?: string
          customer_phone?: string
          id?: string
          online_store_id?: string
          order_number?: string
          payment_method?: string
          shipping_address?: string
          shipping_fee?: number
          status?: string
          store_id?: string
          subtotal?: number
          total?: number
          tracking_token?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_orders_online_store_id_fkey"
            columns: ["online_store_id"]
            isOneToOne: false
            referencedRelation: "online_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_products: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          featured: boolean
          id: string
          product_id: string
          slug: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          enabled?: boolean
          featured?: boolean
          id?: string
          product_id: string
          slug: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          featured?: boolean
          id?: string
          product_id?: string
          slug?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "online_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_stores: {
        Row: {
          accepted_privacy_at: string | null
          accepted_terms_at: string | null
          checkout_note: string
          created_at: string
          description: string
          display_email: string
          display_name: string
          display_phone: string
          id: string
          is_published: boolean
          logo_url: string
          privacy_version: string
          setup_completed: boolean
          shipping_note: string
          slug: string
          store_id: string
          terms_version: string
          updated_at: string
        }
        Insert: {
          accepted_privacy_at?: string | null
          accepted_terms_at?: string | null
          checkout_note?: string
          created_at?: string
          description?: string
          display_email?: string
          display_name: string
          display_phone?: string
          id?: string
          is_published?: boolean
          logo_url?: string
          privacy_version?: string
          setup_completed?: boolean
          shipping_note?: string
          slug: string
          store_id: string
          terms_version?: string
          updated_at?: string
        }
        Update: {
          accepted_privacy_at?: string | null
          accepted_terms_at?: string | null
          checkout_note?: string
          created_at?: string
          description?: string
          display_email?: string
          display_name?: string
          display_phone?: string
          id?: string
          is_published?: boolean
          logo_url?: string
          privacy_version?: string
          setup_completed?: boolean
          shipping_note?: string
          slug?: string
          store_id?: string
          terms_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_fulfillments: {
        Row: {
          branch_id: string | null
          carrier: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          order_id: string
          status: string
          store_id: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          carrier?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          order_id: string
          status?: string
          store_id: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          carrier?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          order_id?: string
          status?: string
          store_id?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_fulfillments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          business_name: string
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          owner_user_id: string
          partner_type: string
          phone: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          business_name: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          owner_user_id: string
          partner_type: string
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          business_name?: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          owner_user_id?: string
          partner_type?: string
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      partner_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          partner_profile_id: string
          requester_user_id: string | null
          status: string
          target_store_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          partner_profile_id: string
          requester_user_id?: string | null
          status?: string
          target_store_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          partner_profile_id?: string
          requester_user_id?: string | null
          status?: string
          target_store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_requests_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_requests_target_store_id_fkey"
            columns: ["target_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          order_id: string | null
          paid_at: string | null
          provider: string
          provider_reference: string | null
          sale_id: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          order_id?: string | null
          paid_at?: string | null
          provider: string
          provider_reference?: string | null
          sale_id?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          order_id?: string | null
          paid_at?: string | null
          provider?: string
          provider_reference?: string | null
          sale_id?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_announcement_reads: {
        Row: {
          announcement_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "platform_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_published: boolean
          kind: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          kind?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_plan_prices: {
        Row: {
          amount: number
          billing_interval: string
          country_code: string
          country_name: string
          currency: string
          id: string
          is_active: boolean
          plan_code: string
          updated_at: string
        }
        Insert: {
          amount: number
          billing_interval: string
          country_code: string
          country_name: string
          currency: string
          id?: string
          is_active?: boolean
          plan_code: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_interval?: string
          country_code?: string
          country_name?: string
          currency?: string
          id?: string
          is_active?: boolean
          plan_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_support_tickets: {
        Row: {
          category: string
          contact_email: string
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          contact_email?: string
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          contact_email?: string
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      premium_entitlements: {
        Row: {
          created_at: string
          description: string
          key: string
          plan_code: string
        }
        Insert: {
          created_at?: string
          description: string
          key: string
          plan_code: string
        }
        Update: {
          created_at?: string
          description?: string
          key?: string
          plan_code?: string
        }
        Relationships: []
      }
      product_bundles: {
        Row: {
          component_product_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          store_id: string
        }
        Insert: {
          component_product_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          store_id: string
        }
        Update: {
          component_product_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bundles_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_bundles_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_bundles_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_bundles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_bundles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_fashion_details: {
        Row: {
          color_options: string[]
          created_at: string
          material: string
          product_id: string
          size_options: string[]
          store_id: string
          style_notes: string
          updated_at: string
        }
        Insert: {
          color_options?: string[]
          created_at?: string
          material?: string
          product_id: string
          size_options?: string[]
          store_id: string
          style_notes?: string
          updated_at?: string
        }
        Update: {
          color_options?: string[]
          created_at?: string
          material?: string
          product_id?: string
          size_options?: string[]
          store_id?: string
          style_notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_fashion_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_fashion_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_fashion_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_fashion_details_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          barcode: string | null
          cost: number | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number | null
          product_id: string
          sku: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          attributes?: Json
          barcode?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          product_id: string
          sku?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          attributes?: Json
          barcode?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string
          category: string
          cost: number
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          low_stock_threshold: number
          name: string
          pack_price: number
          piece_price: number
          price: number
          shelf_id: string | null
          sku: string
          store_id: string
          units_per_pack: number
          updated_at: string
        }
        Insert: {
          barcode?: string
          category?: string
          cost?: number
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          low_stock_threshold?: number
          name: string
          pack_price?: number
          piece_price?: number
          price?: number
          shelf_id?: string | null
          sku?: string
          store_id: string
          units_per_pack?: number
          updated_at?: string
        }
        Update: {
          barcode?: string
          category?: string
          cost?: number
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          low_stock_threshold?: number
          name?: string
          pack_price?: number
          piece_price?: number
          price?: number
          shelf_id?: string | null
          sku?: string
          store_id?: string
          units_per_pack?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "shelves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          theme_preference: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          theme_preference?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          theme_preference?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number | null
          product_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          store_id: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number | null
          product_id: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number
          store_id: string
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number | null
          product_id?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          store_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          ordered_at: string | null
          received_at: string | null
          reference: string
          status: string
          store_id: string
          subtotal: number
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          received_at?: string | null
          reference: string
          status?: string
          store_id: string
          subtotal?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          received_at?: string | null
          reference?: string
          status?: string
          store_id?: string
          subtotal?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          order_id: string | null
          payment_transaction_id: string | null
          processed_at: string | null
          reason: string
          sale_id: string | null
          status: string
          store_id: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string | null
          payment_transaction_id?: string | null
          processed_at?: string | null
          reason: string
          sale_id?: string | null
          status?: string
          store_id: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string | null
          payment_transaction_id?: string | null
          processed_at?: string | null
          reason?: string
          sale_id?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          device_imei: string | null
          device_serial_number: string | null
          electronics_device_id: string | null
          fashion_variant_stock_id: string | null
          food_modifiers: Json
          id: string
          line_total: number
          order_notes: string
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          store_id: string
          unit_price: number
          unit_type: string
          units_per_sale: number
          variant_color: string | null
          variant_size: string | null
        }
        Insert: {
          device_imei?: string | null
          device_serial_number?: string | null
          electronics_device_id?: string | null
          fashion_variant_stock_id?: string | null
          food_modifiers?: Json
          id?: string
          line_total: number
          order_notes?: string
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          store_id: string
          unit_price: number
          unit_type?: string
          units_per_sale?: number
          variant_color?: string | null
          variant_size?: string | null
        }
        Update: {
          device_imei?: string | null
          device_serial_number?: string | null
          electronics_device_id?: string | null
          fashion_variant_stock_id?: string | null
          food_modifiers?: Json
          id?: string
          line_total?: number
          order_notes?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          store_id?: string
          unit_price?: number
          unit_type?: string
          units_per_sale?: number
          variant_color?: string | null
          variant_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_electronics_device_id_fkey"
            columns: ["electronics_device_id"]
            isOneToOne: false
            referencedRelation: "electronics_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_fashion_variant_stock_id_fkey"
            columns: ["fashion_variant_stock_id"]
            isOneToOne: false
            referencedRelation: "fashion_variant_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_return_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          product_id: string
          product_name: string
          quantity: number
          return_id: string
          sale_id: string
          sale_item_id: string
          store_id: string
          unit_price: number
          variant_color: string | null
          variant_size: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          product_id: string
          product_name: string
          quantity: number
          return_id: string
          sale_id: string
          sale_item_id: string
          store_id: string
          unit_price: number
          variant_color?: string | null
          variant_size?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string
          product_name?: string
          quantity?: number
          return_id?: string
          sale_id?: string
          sale_item_id?: string
          store_id?: string
          unit_price?: number
          variant_color?: string | null
          variant_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sale_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "sale_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_returns: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          processed_by: string
          reason: string
          reference: string
          sale_id: string
          store_id: string
          total_amount: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          processed_by: string
          reason: string
          reference: string
          sale_id: string
          store_id: string
          total_amount?: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          processed_by?: string
          reason?: string
          reference?: string
          sale_id?: string
          store_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_returns_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          branch_id: string
          cashier_id: string
          created_at: string
          customer_id: string | null
          id: string
          note: string
          offline_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string
          store_id: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          branch_id: string
          cashier_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          note?: string
          offline_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string
          store_id: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          branch_id?: string
          cashier_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          note?: string
          offline_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string
          store_id?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_segment_insights"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          resource: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          resource: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          resource?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shelves: {
        Row: {
          created_at: string
          id: string
          name: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelves_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          estimated_days_max: number | null
          estimated_days_min: number | null
          id: string
          is_active: boolean
          name: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean
          name: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean
          name?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_accounts: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          department: string | null
          email: string | null
          failed_attempts: number
          id: string
          is_active: boolean
          job_title: string | null
          last_login_at: string | null
          locked_until: string | null
          login_slug: string | null
          name: string
          notes: string | null
          permission_overrides: Json
          phone: string | null
          pin_hash: string
          primary_branch_id: string | null
          role: string
          settings: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          failed_attempts?: number
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_login_at?: string | null
          locked_until?: string | null
          login_slug?: string | null
          name: string
          notes?: string | null
          permission_overrides?: Json
          phone?: string | null
          pin_hash: string
          primary_branch_id?: string | null
          role?: string
          settings?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          failed_attempts?: number
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_login_at?: string | null
          locked_until?: string | null
          login_slug?: string | null
          name?: string
          notes?: string | null
          permission_overrides?: Json
          phone?: string | null
          pin_hash?: string
          primary_branch_id?: string | null
          role?: string
          settings?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_accounts_primary_branch_id_fkey"
            columns: ["primary_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          staff_id: string | null
          store_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          staff_id?: string | null
          store_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          staff_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_audit_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_audit_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_branch_access: {
        Row: {
          branch_id: string
          can_manage_customers: boolean
          can_manage_expenses: boolean
          can_manage_inventory: boolean
          can_manage_orders: boolean
          can_sell: boolean
          can_view_reports: boolean
          created_at: string
          id: string
          is_primary: boolean
          staff_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          can_manage_customers?: boolean
          can_manage_expenses?: boolean
          can_manage_inventory?: boolean
          can_manage_orders?: boolean
          can_sell?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          is_primary?: boolean
          staff_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          can_manage_customers?: boolean
          can_manage_expenses?: boolean
          can_manage_inventory?: boolean
          can_manage_orders?: boolean
          can_sell?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          is_primary?: boolean
          staff_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_branch_access_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branch_access_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branch_access_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_login_events: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          ip_hash: string | null
          staff_id: string
          store_id: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          staff_id: string
          store_id: string
          success: boolean
          user_agent?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          staff_id?: string
          store_id?: string
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_login_events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_login_events_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_login_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permission_overrides: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          permission: string
          staff_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          allowed: boolean
          created_at?: string
          id?: string
          permission: string
          staff_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission?: string
          staff_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_permission_overrides_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_permission_overrides_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_settings: {
        Row: {
          allow_keyboard_shortcuts: boolean
          compact_mode: boolean
          landing_route: string
          language: string
          receipt_auto_print: boolean
          settings: Json
          show_prices: boolean
          show_stock: boolean
          sound_feedback: boolean
          staff_id: string
          store_id: string
          theme: string
          timezone: string
          updated_at: string
        }
        Insert: {
          allow_keyboard_shortcuts?: boolean
          compact_mode?: boolean
          landing_route?: string
          language?: string
          receipt_auto_print?: boolean
          settings?: Json
          show_prices?: boolean
          show_stock?: boolean
          sound_feedback?: boolean
          staff_id: string
          store_id: string
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          allow_keyboard_shortcuts?: boolean
          compact_mode?: boolean
          landing_route?: string
          language?: string
          receipt_auto_print?: boolean
          settings?: Json
          show_prices?: boolean
          show_stock?: boolean
          sound_feedback?: boolean
          staff_id?: string
          store_id?: string
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_settings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          received_quantity: number
          store_id: string
          transfer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          received_quantity?: number
          store_id: string
          transfer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          received_quantity?: number
          store_id?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "online_catalog"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          approved_by: string | null
          created_at: string
          dispatched_at: string | null
          from_branch_id: string
          id: string
          notes: string | null
          received_at: string | null
          reference: string
          requested_at: string
          requested_by: string | null
          status: string
          store_id: string
          to_branch_id: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          dispatched_at?: string | null
          from_branch_id: string
          id?: string
          notes?: string | null
          received_at?: string | null
          reference: string
          requested_at?: string
          requested_by?: string | null
          status?: string
          store_id: string
          to_branch_id: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          dispatched_at?: string | null
          from_branch_id?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          reference?: string
          requested_at?: string
          requested_by?: string | null
          status?: string
          store_id?: string
          to_branch_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      store_activity_log: {
        Row: {
          action: string
          actor_staff_id: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          store_id: string
          summary: string
        }
        Insert: {
          action: string
          actor_staff_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          store_id: string
          summary: string
        }
        Update: {
          action?: string
          actor_staff_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          store_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_activity_log_actor_staff_id_fkey"
            columns: ["actor_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_activity_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_advanced_settings: {
        Row: {
          settings: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          settings?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          settings?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_advanced_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_custom_domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          last_checked_at: string | null
          provider_domain_id: string | null
          status: string
          store_id: string
          updated_at: string
          verification_name: string | null
          verification_type: string
          verification_value: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          last_checked_at?: string | null
          provider_domain_id?: string | null
          status?: string
          store_id: string
          updated_at?: string
          verification_name?: string | null
          verification_type?: string
          verification_value?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          last_checked_at?: string | null
          provider_domain_id?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          verification_name?: string | null
          verification_type?: string
          verification_value?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_custom_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_customer_accounts: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          failed_attempts: number
          id: string
          last_seen_at: string | null
          locked_until: string | null
          name: string
          password_hash: string
          phone: string
          store_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          failed_attempts?: number
          id?: string
          last_seen_at?: string | null
          locked_until?: string | null
          name?: string
          password_hash: string
          phone?: string
          store_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          failed_attempts?: number
          id?: string
          last_seen_at?: string | null
          locked_until?: string | null
          name?: string
          password_hash?: string
          phone?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_customer_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_customer_orders: {
        Row: {
          account_id: string
          linked_at: string
          order_id: string
        }
        Insert: {
          account_id: string
          linked_at?: string
          order_id: string
        }
        Update: {
          account_id?: string
          linked_at?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_customer_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "store_customer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_customer_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "online_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_customer_sessions: {
        Row: {
          account_id: string
          created_at: string
          expires_at: string
          id: string
          last_seen_at: string | null
          token_hash: string
        }
        Insert: {
          account_id: string
          created_at?: string
          expires_at: string
          id?: string
          last_seen_at?: string | null
          token_hash: string
        }
        Update: {
          account_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_seen_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_customer_sessions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "store_customer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      store_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_primary: boolean
          status: string
          store_id: string
          updated_at: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_primary?: boolean
          status?: string
          store_id: string
          updated_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_primary?: boolean
          status?: string
          store_id?: string
          updated_at?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_domains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_feedback: {
        Row: {
          admin_status: string
          contact_email: string
          created_at: string
          feedback_type: string
          id: string
          message: string
          rating: number | null
          reason: string
          store_id: string
        }
        Insert: {
          admin_status?: string
          contact_email?: string
          created_at?: string
          feedback_type: string
          id?: string
          message?: string
          rating?: number | null
          reason?: string
          store_id: string
        }
        Update: {
          admin_status?: string
          contact_email?: string
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          rating?: number | null
          reason?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_feedback_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_hero_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          store_id: string
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          store_id: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          store_id?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_hero_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["store_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_notifications: {
        Row: {
          action_url: string | null
          branch_id: string | null
          created_at: string
          id: string
          message: string
          metadata: Json
          read_at: string | null
          store_id: string
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          branch_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          read_at?: string | null
          store_id: string
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          branch_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          read_at?: string | null
          store_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          permission: string
          staff_role: string
          store_id: string
          updated_at: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission: string
          staff_role: string
          store_id: string
          updated_at?: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission?: string
          staff_role?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_permissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_subscriptions: {
        Row: {
          amount: number
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          expires_at: string | null
          grace_period_ends_at: string | null
          id: string
          interval: string
          last_payment_at: string | null
          metadata: Json
          next_reminder_at: string | null
          plan_code: string | null
          provider: string
          provider_customer_code: string | null
          provider_subscription_code: string | null
          status: string
          store_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          expires_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          interval?: string
          last_payment_at?: string | null
          metadata?: Json
          next_reminder_at?: string | null
          plan_code?: string | null
          provider?: string
          provider_customer_code?: string | null
          provider_subscription_code?: string | null
          status?: string
          store_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          expires_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          interval?: string
          last_payment_at?: string | null
          metadata?: Json
          next_reminder_at?: string | null
          plan_code?: string | null
          provider?: string
          provider_customer_code?: string | null
          provider_subscription_code?: string | null
          status?: string
          store_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_configs: {
        Row: {
          branding: Json
          created_at: string
          custom_css: string
          id: string
          is_published: boolean
          navigation: Json
          sections: Json
          seo: Json
          store_id: string
          template: string
          theme: Json
          updated_at: string
          version: number
        }
        Insert: {
          branding?: Json
          created_at?: string
          custom_css?: string
          id?: string
          is_published?: boolean
          navigation?: Json
          sections?: Json
          seo?: Json
          store_id: string
          template?: string
          theme?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          branding?: Json
          created_at?: string
          custom_css?: string
          id?: string
          is_published?: boolean
          navigation?: Json
          sections?: Json
          seo?: Json
          store_id?: string
          template?: string
          theme?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "storefront_configs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_editor_layouts: {
        Row: {
          draft: Json
          id: string
          published: Json
          published_at: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          draft?: Json
          id?: string
          published?: Json
          published_at?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          draft?: Json
          id?: string
          published?: Json
          published_at?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_editor_layouts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string
          business_goal: string
          business_type: string
          created_at: string
          currency: string
          id: string
          logo_url: string
          low_stock_threshold: number
          name: string
          owner_id: string
          phone: string
          storefront_settings: Json
          tax_rate: number
          team_size: string
          updated_at: string
        }
        Insert: {
          address?: string
          business_goal?: string
          business_type?: string
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string
          low_stock_threshold?: number
          name: string
          owner_id: string
          phone?: string
          storefront_settings?: Json
          tax_rate?: number
          team_size?: string
          updated_at?: string
        }
        Update: {
          address?: string
          business_goal?: string
          business_type?: string
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string
          low_stock_threshold?: number
          name?: string
          owner_id?: string
          phone?: string
          storefront_settings?: Json
          tax_rate?: number
          team_size?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      temporary_tracking_accounts: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          label: string | null
          last_used_at: string | null
          revoked_at: string | null
          store_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked_at?: string | null
          store_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked_at?: string | null
          store_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporary_tracking_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event_type: string
          id: string
          next_attempt_at: string | null
          payload: Json
          response_code: number | null
          status: string
          store_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event_type: string
          id?: string
          next_attempt_at?: string | null
          payload: Json
          response_code?: number | null
          status?: string
          store_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event_type?: string
          id?: string
          next_attempt_at?: string | null
          payload?: Json
          response_code?: number | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string | null
          events: Json
          id: string
          is_active: boolean
          secret_hash: string | null
          store_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          events?: Json
          id?: string
          is_active?: boolean
          secret_hash?: string | null
          store_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          events?: Json
          id?: string
          is_active?: boolean
          secret_hash?: string | null
          store_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_segment_insights: {
        Row: {
          customer_id: string | null
          email: string | null
          last_visit_at: string | null
          name: string | null
          phone: string | null
          segment: string | null
          store_id: string | null
          total_spent: number | null
          visit_count: number | null
        }
        Insert: {
          customer_id?: string | null
          email?: string | null
          last_visit_at?: string | null
          name?: string | null
          phone?: string | null
          segment?: never
          store_id?: string | null
          total_spent?: number | null
          visit_count?: number | null
        }
        Update: {
          customer_id?: string | null
          email?: string | null
          last_visit_at?: string | null
          name?: string | null
          phone?: string | null
          segment?: never
          store_id?: string | null
          total_spent?: number | null
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_intelligence: {
        Row: {
          barcode: string | null
          category: string | null
          cost: number | null
          inventory_cost_value: number | null
          inventory_retail_value: number | null
          low_stock_threshold: number | null
          name: string | null
          price: number | null
          product_id: string | null
          sku: string | null
          stock_status: string | null
          store_id: string | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_catalog: {
        Row: {
          category: string | null
          currency: string | null
          description: string | null
          display_email: string | null
          display_name: string | null
          display_phone: string | null
          featured: boolean | null
          image_url: string | null
          image_urls: Json | null
          logo_url: string | null
          name: string | null
          price: number | null
          product_id: string | null
          sku: string | null
          slug: string | null
          store_description: string | null
          store_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "online_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      online_store_heroes: {
        Row: {
          id: string | null
          image_url: string | null
          slug: string | null
          sort_order: number | null
          store_id: string | null
          subtitle: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "online_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      public_storefront_configs: {
        Row: {
          branding: Json | null
          navigation: Json | null
          sections: Json | null
          seo: Json | null
          store_id: string | null
          template: string | null
          theme: Json | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          branding?: Json | null
          navigation?: Json | null
          sections?: Json | null
          seo?: Json | null
          store_id?: string | null
          template?: string | null
          theme?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          branding?: Json | null
          navigation?: Json | null
          sections?: Json | null
          seo?: Json | null
          store_id?: string | null
          template?: string | null
          theme?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "storefront_configs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      account_security_list_ip_history: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          action: string
          ip_address: string
          occurred_at: string
        }[]
      }
      account_security_list_sessions: {
        Args: { p_user_id: string }
        Returns: {
          aal: string
          created_at: string
          ip: unknown
          not_after: string
          refreshed_at: string
          session_id: string
          tag: string
          updated_at: string
          user_agent: string
        }[]
      }
      account_security_revoke_session: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: boolean
      }
      bulk_import_products: {
        Args: { _branch_id: string; _rows: Json; _store_id: string }
        Returns: Json
      }
      configure_staff: {
        Args: {
          _allow_keyboard_shortcuts: boolean
          _compact_mode: boolean
          _landing_route: string
          _permissions?: Json
          _primary_branch_id: string
          _receipt_auto_print: boolean
          _show_prices: boolean
          _show_stock: boolean
          _sound_feedback: boolean
          _staff_id: string
        }
        Returns: boolean
      }
      create_electronics_repair: {
        Args: {
          _branch_id: string
          _customer_id: string
          _customer_name: string
          _customer_phone: string
          _device_id: string
          _device_label: string
          _due_at?: string
          _estimated_cost?: number
          _issue_description: string
          _store_id: string
          _warranty_claim?: boolean
        }
        Returns: string
      }
      create_online_order: {
        Args: {
          _customer_email: string
          _customer_name: string
          _customer_note: string
          _customer_phone: string
          _items: Json
          _payment_method: string
          _shipping_address: string
          _slug: string
        }
        Returns: string
      }
      create_sale: {
        Args: {
          _branch_id: string
          _customer_id?: string
          _items: Json
          _note?: string
          _offline_id?: string
          _payment_method: string
          _store_id: string
        }
        Returns: string
      }
      create_staff_account: {
        Args: { _name: string; _pin: string; _role?: string; _store_id: string }
        Returns: {
          id: string
          is_active: boolean
          name: string
          role: string
        }[]
      }
      create_store: {
        Args: {
          _branch_name?: string
          _currency: string
          _name: string
          _tax_rate?: number
        }
        Returns: string
      }
      customer_account_cleanup_expired: { Args: never; Returns: number }
      customer_account_get: { Args: { _token: string }; Returns: Json }
      customer_account_link_order: {
        Args: { _token: string; _tracking_token: string }
        Returns: Json
      }
      customer_account_login: {
        Args: { _email: string; _password: string; _slug: string }
        Returns: Json
      }
      customer_account_logout: { Args: { _token: string }; Returns: boolean }
      customer_account_orders: {
        Args: { _token: string }
        Returns: {
          created_at: string
          order_id: string
          order_number: string
          status: string
          total: number
          tracking_token: string
        }[]
      }
      customer_account_register: {
        Args: {
          _email: string
          _name: string
          _password: string
          _phone: string
          _slug: string
        }
        Returns: Json
      }
      delete_storeless_accounts: { Args: never; Returns: number }
      expire_premium_subscriptions: { Args: never; Returns: number }
      generate_staff_login_slug: { Args: { _name: string }; Returns: string }
      get_effective_plan: { Args: { p_store_id: string }; Returns: string }
      get_order_tracking: { Args: { p_token: string }; Returns: Json }
      get_order_tracking_token: {
        Args: { _customer_phone: string; _order_number: string }
        Returns: string
      }
      get_public_related_products: {
        Args: {
          _category?: string
          _limit?: number
          _product_id: string
          _store_slug: string
        }
        Returns: {
          available: boolean
          currency: string
          image_url: string
          product_id: string
          product_name: string
          product_price: number
          product_slug: string
        }[]
      }
      get_public_store_catalog: {
        Args: { _slug: string }
        Returns: {
          category: string
          description: string
          featured: boolean
          image_url: string
          image_urls: string[]
          name: string
          price: number
          product_id: string
          stock_quantity: number
        }[]
      }
      get_public_store_catalog_v2: {
        Args: { _slug: string }
        Returns: {
          category: string
          description: string
          fashion_variants: Json
          featured: boolean
          image_url: string
          image_urls: string[]
          name: string
          price: number
          product_id: string
          stock_quantity: number
        }[]
      }
      get_public_store_category_products: {
        Args: { _category: string; _limit?: number; _store_slug: string }
        Returns: {
          available: boolean
          category: string
          currency: string
          image_url: string
          product_id: string
          product_name: string
          product_price: number
          product_slug: string
          store_id: string
          store_name: string
          store_slug: string
        }[]
      }
      get_public_store_product: {
        Args: { _product_slug: string; _store_slug: string }
        Returns: {
          available: boolean
          currency: string
          product_category: string
          product_description: string
          product_featured: boolean
          product_id: string
          product_image_url: string
          product_image_urls: string[]
          product_name: string
          product_price: number
          product_sku: string
          product_slug: string
          stock_quantity: number
          store_description: string
          store_id: string
          store_logo_url: string
          store_name: string
          store_slug: string
        }[]
      }
      has_store_role: {
        Args: {
          _roles: Database["public"]["Enums"]["store_role"][]
          _store_id: string
          _user_id: string
        }
        Returns: boolean
      }
      hash_staff_pin: { Args: { _pin: string }; Returns: string }
      is_active_premium_store: { Args: { _store_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_product_public_online: {
        Args: { _product_id: string }
        Returns: boolean
      }
      is_published_online_store: {
        Args: { _store_id: string }
        Returns: boolean
      }
      is_store_member: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
      is_store_owner: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
      kudi_slugify: { Args: { _value: string }; Returns: string }
      list_staff_accounts: {
        Args: { _store_id: string }
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          last_login_at: string
          locked_until: string
          name: string
          role: string
        }[]
      }
      list_staff_branch_access: {
        Args: { _staff_id: string }
        Returns: {
          branch_id: string
          branch_name: string
          can_manage_customers: boolean
          can_manage_expenses: boolean
          can_manage_inventory: boolean
          can_manage_orders: boolean
          can_sell: boolean
          can_view_reports: boolean
          is_primary: boolean
        }[]
      }
      platform_admin_dashboard: { Args: never; Returns: Json }
      platform_admin_update_feedback: {
        Args: { _id: string; _status: string }
        Returns: undefined
      }
      platform_admin_update_ticket: {
        Args: { _id: string; _status: string }
        Returns: undefined
      }
      platform_admin_upsert_price: {
        Args: {
          _amount: number
          _billing_interval: string
          _country_code: string
          _country_name: string
          _currency: string
          _is_active?: boolean
          _plan_code: string
        }
        Returns: undefined
      }
      process_fashion_return: {
        Args: {
          _items: Json
          _reason: string
          _sale_id: string
          _store_id: string
        }
        Returns: string
      }
      public_store_has_premium: {
        Args: { p_store_id: string }
        Returns: boolean
      }
      record_food_waste: {
        Args: {
          _branch_id: string
          _ingredient_product_id: string
          _quantity: number
          _reason: string
          _store_id: string
        }
        Returns: string
      }
      record_inventory_batch_waste: {
        Args: {
          _batch_id: string
          _branch_id: string
          _quantity: number
          _reason: string
          _store_id: string
        }
        Returns: string
      }
      refresh_expired_inventory_batches: {
        Args: { _branch_id: string; _store_id: string }
        Returns: number
      }
      staff_assign_branch: {
        Args: {
          _branch_id: string
          _can_manage_customers?: boolean
          _can_manage_expenses?: boolean
          _can_manage_inventory?: boolean
          _can_manage_orders?: boolean
          _can_sell?: boolean
          _can_view_reports?: boolean
          _staff_id: string
        }
        Returns: boolean
      }
      staff_login_profile: { Args: { _slug: string }; Returns: Json }
      staff_login_url: { Args: { _slug: string }; Returns: string }
      staff_remove_branch: {
        Args: { _branch_id: string; _staff_id: string }
        Returns: boolean
      }
      store_has_premium: {
        Args: { p_required_plan?: string; p_store_id: string }
        Returns: boolean
      }
      upsert_storefront_config: {
        Args: {
          _branding: Json
          _custom_css: string
          _navigation: Json
          _publish: boolean
          _sections: Json
          _seo: Json
          _store_id: string
          _template: string
          _theme: Json
        }
        Returns: {
          branding: Json
          created_at: string
          custom_css: string
          id: string
          is_published: boolean
          navigation: Json
          sections: Json
          seo: Json
          store_id: string
          template: string
          theme: Json
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "storefront_configs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_temporary_tracking_token: {
        Args: { p_token_hash: string }
        Returns: {
          expires_at: string
          store_id: string
          tracking_account_id: string
        }[]
      }
      verify_staff_pin: {
        Args: { _pin: string; _staff_id: string; _store_id: string }
        Returns: Json
      }
    }
    Enums: {
      payment_method: "cash" | "card" | "transfer" | "credit"
      store_role:
        | "owner"
        | "manager"
        | "cashier"
        | "inventory"
        | "sales"
        | "viewer"
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
  public: {
    Enums: {
      payment_method: ["cash", "card", "transfer", "credit"],
      store_role: [
        "owner",
        "manager",
        "cashier",
        "inventory",
        "sales",
        "viewer",
      ],
    },
  },
} as const
