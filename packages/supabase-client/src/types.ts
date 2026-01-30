export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      analytics_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_type: string
          game_id: string
          id: string
          link_id: string | null
          referrer: string | null
          user_id: string | null
          visitor_hash: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          game_id: string
          id?: string
          link_id?: string | null
          referrer?: string | null
          user_id?: string | null
          visitor_hash: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          game_id?: string
          id?: string
          link_id?: string | null
          referrer?: string | null
          user_id?: string | null
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "game_links"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: number
          ip_address: unknown | null
          metadata: Json | null
          organization_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          ip_address?: unknown | null
          metadata?: Json | null
          organization_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          ip_address?: unknown | null
          metadata?: Json | null
          organization_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      change_requests: {
        Row: {
          created_at: string
          current_value: string
          entity_id: string
          entity_type: string
          field_name: string
          id: number
          reason: string | null
          requested_by: string
          requested_value: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
        }
        Insert: {
          created_at?: string
          current_value: string
          entity_id: string
          entity_type: string
          field_name: string
          id?: never
          reason?: string | null
          requested_by: string
          requested_value: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          current_value?: string
          entity_id?: string
          entity_type?: string
          field_name?: string
          id?: never
          reason?: string | null
          requested_by?: string
          requested_value?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      game_credits: {
        Row: {
          custom_name: string | null
          game_id: string
          id: number
          organization_id: string | null
          role: Database["public"]["Enums"]["credit_role"]
        }
        Insert: {
          custom_name?: string | null
          game_id: string
          id?: never
          organization_id?: string | null
          role: Database["public"]["Enums"]["credit_role"]
        }
        Update: {
          custom_name?: string | null
          game_id?: string
          id?: never
          organization_id?: string | null
          role?: Database["public"]["Enums"]["credit_role"]
        }
        Relationships: [
          {
            foreignKeyName: "game_credits_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_credits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      game_links: {
        Row: {
          category: string
          created_at: string
          game_id: string
          id: string
          label: string
          position: number
          type: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          game_id: string
          id?: string
          label: string
          position?: number
          type: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          game_id?: string
          id?: string
          label?: string
          position?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_links_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_pages: {
        Row: {
          created_at: string
          game_id: string
          id: string
          is_primary: boolean
          last_slug_change: string | null
          page_config: Json
          published_at: string | null
          slug: string
          unpublished_at: string | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["page_visibility"]
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          is_primary?: boolean
          last_slug_change?: string | null
          page_config?: Json
          published_at?: string | null
          slug: string
          unpublished_at?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["page_visibility"]
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          is_primary?: boolean
          last_slug_change?: string | null
          page_config?: Json
          published_at?: string | null
          slug?: string
          unpublished_at?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["page_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "game_pages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_subscribers: {
        Row: {
          confirmed: boolean
          created_at: string
          email: string
          game_id: string
          id: string
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          email: string
          game_id: string
          id?: string
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          email?: string
          game_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_subscribers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          cover_url: string | null
          created_at: string
          description: Json | null
          genres: string[] | null
          header_url: string | null
          id: string
          last_name_change: string | null
          owner_organization_id: string
          platforms: Json | null
          release_date: string | null
          status: Database["public"]["Enums"]["game_status"]
          summary: string | null
          theme_color: string | null
          title: string
          trailer_url: string | null
          updated_at: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: Json | null
          genres?: string[] | null
          header_url?: string | null
          id?: string
          last_name_change?: string | null
          owner_organization_id: string
          platforms?: Json | null
          release_date?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          summary?: string | null
          theme_color?: string | null
          title: string
          trailer_url?: string | null
          updated_at?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: Json | null
          genres?: string[] | null
          header_url?: string | null
          id?: string
          last_name_change?: string | null
          owner_organization_id?: string
          platforms?: Json | null
          release_date?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          summary?: string | null
          theme_color?: string | null
          title?: string
          trailer_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: number
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: never
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: never
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizations: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_verified: boolean
          last_name_change: string | null
          last_slug_change: string | null
          name: string
          slug: string
          stripe_customer_id: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          last_name_change?: string | null
          last_slug_change?: string | null
          name: string
          slug: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          last_name_change?: string | null
          last_slug_change?: string | null
          name?: string
          slug?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_devices: {
        Args: {
          p_game_id: string
          p_from: string
          p_to: string
        }
        Returns: {
          device_type: string
          total: number
        }[]
      }
      analytics_summary: {
        Args: {
          p_game_id: string
          p_from: string
          p_to: string
        }
        Returns: {
          event_type: string
          total: number
          unique_visitors: number
        }[]
      }
      analytics_timeseries: {
        Args: {
          p_game_id: string
          p_from: string
          p_to: string
        }
        Returns: {
          day: string
          event_type: string
          total: number
          unique_visitors: number
        }[]
      }
      analytics_top_countries: {
        Args: {
          p_game_id: string
          p_from: string
          p_to: string
          p_limit?: number
        }
        Returns: {
          country: string
          total: number
        }[]
      }
      analytics_top_links: {
        Args: {
          p_game_id: string
          p_from: string
          p_to: string
          p_limit?: number
        }
        Returns: {
          link_id: string
          label: string
          url: string
          total: number
        }[]
      }
      analytics_top_referrers: {
        Args: {
          p_game_id: string
          p_from: string
          p_to: string
          p_limit?: number
        }
        Returns: {
          referrer: string
          total: number
        }[]
      }
      cleanup_expired_invites: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      credit_role:
        | "DEVELOPER"
        | "PUBLISHER"
        | "PORTING"
        | "MARKETING"
        | "SUPPORT"
      game_status:
        | "IN_DEVELOPMENT"
        | "UPCOMING"
        | "EARLY_ACCESS"
        | "RELEASED"
        | "CANCELLED"
      org_role: "OWNER" | "ADMIN" | "MEMBER"
      page_visibility: "DRAFT" | "PUBLISHED" | "ARCHIVED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      credit_role: ["DEVELOPER", "PUBLISHER", "PORTING", "MARKETING", "SUPPORT"] as const,
      game_status: ["IN_DEVELOPMENT", "UPCOMING", "EARLY_ACCESS", "RELEASED", "CANCELLED"] as const,
      org_role: ["OWNER", "ADMIN", "MEMBER"] as const,
      page_visibility: ["DRAFT", "PUBLISHED", "ARCHIVED"] as const,
    },
  },
} as const

