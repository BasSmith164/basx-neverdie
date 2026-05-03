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
      banks: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          created_at: string
          id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          created_at?: string
          id?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          id: string
          image: string
          sort_order: number
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image: string
          sort_order?: number
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          delivery_type: string
          description: string
          hot: boolean
          id: string
          image: string
          name: string
          platforms: string[]
          price: number
          promo_code_id: string | null
          sale_price: number | null
          sort_order: number
          stock: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          delivery_type?: string
          description?: string
          hot?: boolean
          id?: string
          image?: string
          name: string
          platforms?: string[]
          price?: number
          promo_code_id?: string | null
          sale_price?: number | null
          sort_order?: number
          stock?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          delivery_type?: string
          description?: string
          hot?: boolean
          id?: string
          image?: string
          name?: string
          platforms?: string[]
          price?: number
          promo_code_id?: string | null
          sale_price?: number | null
          sort_order?: number
          stock?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          points: number
          total_topup: number
          updated_at: string
          user_id: string
          username: string
          wallet: number
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          total_topup?: number
          updated_at?: string
          user_id: string
          username: string
          wallet?: number
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          total_topup?: number
          updated_at?: string
          user_id?: string
          username?: string
          wallet?: number
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percent: number
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_percent?: number
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_percent?: number
          id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          delivered: Json
          delivery_type: string
          id: string
          price: number
          product_id: string | null
          product_image: string
          product_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered?: Json
          delivery_type: string
          id?: string
          price: number
          product_id?: string | null
          product_image?: string
          product_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivered?: Json
          delivery_type?: string
          id?: string
          price?: number
          product_id?: string | null
          product_image?: string
          product_name?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          announcement: Json
          bank_bot_enabled: boolean
          discord_url: string
          id: number
          logo: string
          particles: Json
          shop_name: string
          theme: Json
          truewallet_bot_enabled: boolean
          truewallet_phone: string
          updated_at: string
        }
        Insert: {
          announcement?: Json
          bank_bot_enabled?: boolean
          discord_url?: string
          id?: number
          logo?: string
          particles?: Json
          shop_name?: string
          theme?: Json
          truewallet_bot_enabled?: boolean
          truewallet_phone?: string
          updated_at?: string
        }
        Update: {
          announcement?: Json
          bank_bot_enabled?: boolean
          discord_url?: string
          id?: number
          logo?: string
          particles?: Json
          shop_name?: string
          theme?: Json
          truewallet_bot_enabled?: boolean
          truewallet_phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      topup_requests: {
        Row: {
          amount: number
          auto_verified: boolean
          created_at: string
          gift_link: string | null
          id: string
          method: string
          note: string | null
          slip_image: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          auto_verified?: boolean
          created_at?: string
          gift_link?: string | null
          id?: string
          method: string
          note?: string | null
          slip_image?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_verified?: boolean
          created_at?: string
          gift_link?: string | null
          id?: string
          method?: string
          note?: string | null
          slip_image?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_topup: { Args: { _id: string }; Returns: Json }
      buy_product: {
        Args: { _code?: string; _product_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
