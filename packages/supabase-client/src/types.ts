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
      analytics_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_type: string
          game_id: string | null
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
          game_id?: string | null
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
          game_id?: string | null
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
          ip_address: unknown
          metadata: Json | null
          studio_id: string | null
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
          ip_address?: unknown
          metadata?: Json | null
          studio_id?: string | null
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
          ip_address?: unknown
          metadata?: Json | null
          studio_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
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
      campaign_events: {
        Row: {
          campaign_id: string
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          referrer: string | null
          visitor_hash: string
        }
        Insert: {
          campaign_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          referrer?: string | null
          visitor_hash: string
        }
        Update: {
          campaign_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          referrer?: string | null
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          destination: string
          destination_url: string | null
          game_id: string
          id: string
          name: string
          slug: string
          status: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          destination?: string
          destination_url?: string | null
          game_id: string
          id?: string
          name: string
          slug: string
          status?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          destination?: string
          destination_url?: string | null
          game_id?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
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
          role: Database["public"]["Enums"]["credit_role"]
          studio_id: string | null
        }
        Insert: {
          custom_name?: string | null
          game_id: string
          id?: never
          role: Database["public"]["Enums"]["credit_role"]
          studio_id?: string | null
        }
        Update: {
          custom_name?: string | null
          game_id?: string
          id?: never
          role?: Database["public"]["Enums"]["credit_role"]
          studio_id?: string | null
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
            foreignKeyName: "game_credits_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
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
      game_media: {
        Row: {
          created_at: string
          game_id: string
          id: string
          position: number
          thumbnail_url: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          position?: number
          thumbnail_url?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          position?: number
          thumbnail_url?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_media_game_id_fkey"
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
          is_claimable: boolean
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
          is_claimable?: boolean
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
          is_claimable?: boolean
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
          unsubscribed_at: string | null
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          email: string
          game_id: string
          id?: string
          unsubscribed_at?: string | null
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          email?: string
          game_id?: string
          id?: string
          unsubscribed_at?: string | null
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
      game_updates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          game_id: string
          id: string
          published_at: string | null
          published_by: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          game_id: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          game_id?: string
          id?: string
          published_at?: string | null
          published_by?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_updates_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          about_the_game: Json | null
          controller_support: string | null
          cover_url: string | null
          created_at: string
          genres: string[] | null
          header_url: string | null
          id: string
          is_free: boolean
          last_name_change: string | null
          linux_requirements: Json | null
          mac_requirements: Json | null
          owner_studio_id: string
          pc_requirements: Json | null
          platforms: Json | null
          release_date: string | null
          status: Database["public"]["Enums"]["game_status"]
          supported_languages: Json
          summary: string | null
          theme_color: string | null
          title: string
          trailer_url: string | null
          type: Database["public"]["Enums"]["game_type"]
          updated_at: string | null
        }
        Insert: {
          about_the_game?: Json | null
          controller_support?: string | null
          cover_url?: string | null
          created_at?: string
          genres?: string[] | null
          header_url?: string | null
          id?: string
          is_free?: boolean
          last_name_change?: string | null
          linux_requirements?: Json | null
          mac_requirements?: Json | null
          owner_studio_id: string
          pc_requirements?: Json | null
          platforms?: Json | null
          release_date?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          supported_languages?: Json
          summary?: string | null
          theme_color?: string | null
          title: string
          trailer_url?: string | null
          type?: Database["public"]["Enums"]["game_type"]
          updated_at?: string | null
        }
        Update: {
          about_the_game?: Json | null
          controller_support?: string | null
          cover_url?: string | null
          created_at?: string
          genres?: string[] | null
          header_url?: string | null
          id?: string
          is_free?: boolean
          last_name_change?: string | null
          linux_requirements?: Json | null
          mac_requirements?: Json | null
          owner_studio_id?: string
          pc_requirements?: Json | null
          platforms?: Json | null
          release_date?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          supported_languages?: Json
          summary?: string | null
          theme_color?: string | null
          title?: string
          trailer_url?: string | null
          type?: Database["public"]["Enums"]["game_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_owner_studio_id_fkey"
            columns: ["owner_studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
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
          role: Database["public"]["Enums"]["studio_role"]
          studio_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: never
          role: Database["public"]["Enums"]["studio_role"]
          studio_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: never
          role?: Database["public"]["Enums"]["studio_role"]
          studio_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
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
      studio_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["studio_role"]
          studio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["studio_role"]
          studio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["studio_role"]
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_members_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      studios: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          background_color: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_claimable: boolean
          is_verified: boolean
          last_name_change: string | null
          last_slug_change: string | null
          name: string
          slug: string
          social_links: Json | null
          stripe_customer_id: string | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          avatar_url?: string | null
          background_color?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_claimable?: boolean
          is_verified?: boolean
          last_name_change?: string | null
          last_slug_change?: string | null
          name: string
          slug: string
          social_links?: Json | null
          stripe_customer_id?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          avatar_url?: string | null
          background_color?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_claimable?: boolean
          is_verified?: boolean
          last_name_change?: string | null
          last_slug_change?: string | null
          name?: string
          slug?: string
          social_links?: Json | null
          stripe_customer_id?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_devices: {
        Args: { p_from: string; p_game_id: string; p_to: string }
        Returns: {
          device_type: string
          total: number
        }[]
      }
      analytics_summary: {
        Args: { p_from: string; p_game_id: string; p_to: string }
        Returns: {
          event_type: string
          total: number
          unique_visitors: number
        }[]
      }
      analytics_timeseries: {
        Args: { p_from: string; p_game_id: string; p_to: string }
        Returns: {
          day: string
          event_type: string
          total: number
          unique_visitors: number
        }[]
      }
      analytics_top_countries: {
        Args: {
          p_from: string
          p_game_id: string
          p_limit?: number
          p_to: string
        }
        Returns: {
          country: string
          total: number
        }[]
      }
      analytics_top_links: {
        Args: {
          p_from: string
          p_game_id: string
          p_limit?: number
          p_to: string
        }
        Returns: {
          label: string
          link_id: string
          total: number
          url: string
        }[]
      }
      analytics_top_referrers: {
        Args: {
          p_from: string
          p_game_id: string
          p_limit?: number
          p_to: string
        }
        Returns: {
          referrer: string
          total: number
        }[]
      }
      audience_by_game: {
        Args: { p_from: string; p_studio_id: string; p_to: string }
        Returns: {
          cover_url: string
          game_id: string
          game_title: string
          net_growth: number
          subscribers_gained: number
          total_subscribers: number
          unsubscribes: number
        }[]
      }
      audience_summary: {
        Args: {
          p_from: string
          p_game_id?: string
          p_studio_id: string
          p_to: string
        }
        Returns: {
          confirmed_count: number
          net_growth: number
          pending_count: number
          subscribers_gained: number
          total_subscribers: number
          unsubscribes: number
        }[]
      }
      audience_timeseries: {
        Args: {
          p_from: string
          p_game_id?: string
          p_studio_id: string
          p_to: string
        }
        Returns: {
          day: string
          net_growth: number
          subscribers_gained: number
          unsubscribes: number
        }[]
      }
      campaign_summary: {
        Args: { p_campaign_id: string; p_from: string; p_to: string }
        Returns: {
          total_clicks: number
          unique_visitors: number
        }[]
      }
      campaign_timeseries: {
        Args: { p_campaign_id: string; p_from: string; p_to: string }
        Returns: {
          day: string
          total_clicks: number
          unique_visitors: number
        }[]
      }
      campaign_top_countries: {
        Args: {
          p_campaign_id: string
          p_from: string
          p_limit?: number
          p_to: string
        }
        Returns: {
          country: string
          total: number
        }[]
      }
      campaign_top_referrers: {
        Args: {
          p_campaign_id: string
          p_from: string
          p_limit?: number
          p_to: string
        }
        Returns: {
          referrer: string
          total: number
        }[]
      }
      cleanup_expired_invites: { Args: never; Returns: number }
      studio_analytics_devices: {
        Args: { p_from: string; p_studio_id: string; p_to: string }
        Returns: {
          device_type: string
          total: number
        }[]
      }
      studio_analytics_summary: {
        Args: { p_from: string; p_studio_id: string; p_to: string }
        Returns: {
          follows: number
          link_clicks: number
          page_views: number
          unique_visitors: number
        }[]
      }
      studio_analytics_timeseries: {
        Args: { p_from: string; p_studio_id: string; p_to: string }
        Returns: {
          day: string
          follows: number
          link_clicks: number
          page_views: number
        }[]
      }
      studio_analytics_top_countries: {
        Args: {
          p_from: string
          p_limit?: number
          p_studio_id: string
          p_to: string
        }
        Returns: {
          country: string
          total: number
        }[]
      }
      studio_analytics_top_games: {
        Args: {
          p_from: string
          p_limit?: number
          p_studio_id: string
          p_to: string
        }
        Returns: {
          follows: number
          game_id: string
          link_clicks: number
          page_views: number
          title: string
        }[]
      }
      studio_analytics_top_platforms: {
        Args: {
          p_from: string
          p_limit?: number
          p_studio_id: string
          p_to: string
        }
        Returns: {
          platform: string
          total: number
        }[]
      }
      studio_analytics_top_referrers: {
        Args: {
          p_from: string
          p_limit?: number
          p_studio_id: string
          p_to: string
        }
        Returns: {
          referrer: string
          total: number
        }[]
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
      game_type: "game" | "dlc" | "demo" | "video" | "mod" | "music" | "unknown"
      page_visibility: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      studio_role: "OWNER" | "ADMIN" | "MEMBER"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      credit_role: [
        "DEVELOPER",
        "PUBLISHER",
        "PORTING",
        "MARKETING",
        "SUPPORT",
      ],
      game_status: [
        "IN_DEVELOPMENT",
        "UPCOMING",
        "EARLY_ACCESS",
        "RELEASED",
        "CANCELLED",
      ],
      game_type: ["game", "dlc", "demo", "video", "mod", "music", "unknown"],
      page_visibility: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      studio_role: ["OWNER", "ADMIN", "MEMBER"],
    },
  },
} as const
