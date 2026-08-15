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
      achievements: {
        Row: {
          description: string | null
          earned_at: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          description?: string | null
          earned_at?: string
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          description?: string | null
          earned_at?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      book_analyses: {
        Row: {
          applications: Json
          book_id: string
          category: string | null
          concepts: Json
          created_at: string
          frameworks: Json
          id: string
          main_theme: string | null
          objective: string | null
          principles: Json
          summary: string | null
          user_id: string
        }
        Insert: {
          applications?: Json
          book_id: string
          category?: string | null
          concepts?: Json
          created_at?: string
          frameworks?: Json
          id?: string
          main_theme?: string | null
          objective?: string | null
          principles?: Json
          summary?: string | null
          user_id: string
        }
        Update: {
          applications?: Json
          book_id?: string
          category?: string | null
          concepts?: Json
          created_at?: string
          frameworks?: Json
          id?: string
          main_theme?: string | null
          objective?: string | null
          principles?: Json
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_analyses_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          chapter_count: number | null
          cover_url: string | null
          created_at: string
          file_path: string | null
          file_size: number | null
          file_type: string
          id: string
          page_count: number | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          author?: string | null
          chapter_count?: number | null
          cover_url?: string | null
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          file_type: string
          id?: string
          page_count?: number | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          author?: string | null
          chapter_count?: number | null
          cover_url?: string | null
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          id?: string
          page_count?: number | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          completed_at: string
          difficulty: string | null
          id: string
          journey_day_id: string
          note: string | null
          reflection: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          difficulty?: string | null
          id?: string
          journey_day_id: string
          note?: string | null
          reflection?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          difficulty?: string | null
          id?: string
          journey_day_id?: string
          note?: string | null
          reflection?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_journey_day_id_fkey"
            columns: ["journey_day_id"]
            isOneToOne: false
            referencedRelation: "journey_days"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_days: {
        Row: {
          action: string | null
          activity_type: string | null
          completed_at: string | null
          concept: string | null
          day_number: number
          estimated_time: string | null
          id: string
          journey_id: string
          objective: string | null
          phase: string
          reflection: string | null
          status: string
          title: string
          user_id: string
          xp: number
        }
        Insert: {
          action?: string | null
          activity_type?: string | null
          completed_at?: string | null
          concept?: string | null
          day_number: number
          estimated_time?: string | null
          id?: string
          journey_id: string
          objective?: string | null
          phase?: string
          reflection?: string | null
          status?: string
          title: string
          user_id: string
          xp?: number
        }
        Update: {
          action?: string | null
          activity_type?: string | null
          completed_at?: string | null
          concept?: string | null
          day_number?: number
          estimated_time?: string | null
          id?: string
          journey_id?: string
          objective?: string | null
          phase?: string
          reflection?: string | null
          status?: string
          title?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "journey_days_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          book_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          duration: number
          id: string
          progress: number
          status: string
          title: string
          user_id: string
        }
        Insert: {
          book_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          progress?: number
          status?: string
          title: string
          user_id: string
        }
        Update: {
          book_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          progress?: number
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journeys_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          last_completed_date: string | null
          level: number
          longest_streak: number
          streak: number
          user_id: string
          xp: number
        }
        Insert: {
          last_completed_date?: string | null
          level?: number
          longest_streak?: number
          streak?: number
          user_id: string
          xp?: number
        }
        Update: {
          last_completed_date?: string | null
          level?: number
          longest_streak?: number
          streak?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
