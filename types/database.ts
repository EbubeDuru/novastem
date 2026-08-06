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
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: number
          metadata: Json | null
          opportunity_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: never
          metadata?: Json | null
          opportunity_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: never
          metadata?: Json | null
          opportunity_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          id: string
          notes: string | null
          opportunity_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      career_pathways: {
        Row: {
          description: string | null
          icon: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          id: number
          iso_code: string
          name: string
        }
        Insert: {
          id?: never
          iso_code: string
          name: string
        }
        Update: {
          id?: never
          iso_code?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          application_deadline: string | null
          application_opens_at: string | null
          application_url: string
          category_id: number | null
          country_id: number | null
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          eligibility_rules: Json
          ends_at: string | null
          extraction_confidence: number | null
          funding_amount_cents: number | null
          funding_currency: string | null
          funding_type: Database["public"]["Enums"]["funding_type"] | null
          id: string
          is_remote: boolean
          last_verified_at: string | null
          official_website: string | null
          organization_id: string | null
          pathway_id: number | null
          province_id: number | null
          review_status: Database["public"]["Enums"]["review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          save_count: number
          source: Database["public"]["Enums"]["source_type"]
          source_url: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string
          view_count: number
        }
        Insert: {
          application_deadline?: string | null
          application_opens_at?: string | null
          application_url: string
          category_id?: number | null
          country_id?: number | null
          created_at?: string
          description: string
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          eligibility_rules?: Json
          ends_at?: string | null
          extraction_confidence?: number | null
          funding_amount_cents?: number | null
          funding_currency?: string | null
          funding_type?: Database["public"]["Enums"]["funding_type"] | null
          id?: string
          is_remote?: boolean
          last_verified_at?: string | null
          official_website?: string | null
          organization_id?: string | null
          pathway_id?: number | null
          province_id?: number | null
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          save_count?: number
          source?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
          view_count?: number
        }
        Update: {
          application_deadline?: string | null
          application_opens_at?: string | null
          application_url?: string
          category_id?: number | null
          country_id?: number | null
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          eligibility_rules?: Json
          ends_at?: string | null
          extraction_confidence?: number | null
          funding_amount_cents?: number | null
          funding_currency?: string | null
          funding_type?: Database["public"]["Enums"]["funding_type"] | null
          id?: string
          is_remote?: boolean
          last_verified_at?: string | null
          official_website?: string | null
          organization_id?: string | null
          pathway_id?: number | null
          province_id?: number | null
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          save_count?: number
          source?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "career_pathways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_preference_countries: {
        Row: {
          country_id: number
          user_id: string
        }
        Insert: {
          country_id: number
          user_id: string
        }
        Update: {
          country_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_preference_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_preference_countries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_preferences: {
        Row: {
          mode: Database["public"]["Enums"]["opportunity_region_mode"]
          updated_at: string
          user_id: string
        }
        Insert: {
          mode?: Database["public"]["Enums"]["opportunity_region_mode"]
          updated_at?: string
          user_id: string
        }
        Update: {
          mode?: Database["public"]["Enums"]["opportunity_region_mode"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_tags: {
        Row: {
          opportunity_id: string
          tag_id: number
        }
        Insert: {
          opportunity_id: string
          tag_id: number
        }
        Update: {
          opportunity_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_tags_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_profiles: {
        Row: {
          description: string | null
          logo_url: string | null
          org_name: string
          updated_at: string
          user_id: string
          verified: boolean
          verified_at: string | null
          website: string | null
        }
        Insert: {
          description?: string | null
          logo_url?: string | null
          org_name: string
          updated_at?: string
          user_id: string
          verified?: boolean
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          description?: string | null
          logo_url?: string | null
          org_name?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_stages: {
        Row: {
          description: string | null
          id: number
          order: number
          pathway_id: number
          title: string
        }
        Insert: {
          description?: string | null
          id?: number
          order: number
          pathway_id: number
          title: string
        }
        Update: {
          description?: string | null
          id?: number
          order?: number
          pathway_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_stages_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "career_pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          code: string | null
          country_id: number
          id: number
          name: string
        }
        Insert: {
          code?: string | null
          country_id: number
          id?: number
          name: string
        }
        Update: {
          code?: string | null
          country_id?: number
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "provinces_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          generated_at: string
          id: string
          match_score: number
          opportunity_id: string
          reasons: Json
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          match_score: number
          opportunity_id: string
          reasons?: Json
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          match_score?: number
          opportunity_id?: string
          reasons?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          opportunity_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_opportunities: {
        Row: {
          opportunity_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          opportunity_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          opportunity_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          country_id: number | null
          created_at: string
          id: string
          name: string
          province_id: number | null
          school_type: string | null
        }
        Insert: {
          country_id?: number | null
          created_at?: string
          id?: string
          name: string
          province_id?: number | null
          school_type?: string | null
        }
        Update: {
          country_id?: number | null
          created_at?: string
          id?: string
          name?: string
          province_id?: number | null
          school_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          id: number
          name: string
        }
        Insert: {
          category?: string | null
          id?: number
          name: string
        }
        Update: {
          category?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          bio: string | null
          career_goals: string[] | null
          citizenship_status: string | null
          country_id: number | null
          date_of_birth: string | null
          grade: string | null
          interests: string[] | null
          languages: string[] | null
          province_id: number | null
          residency_country_id: number | null
          school_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          career_goals?: string[] | null
          citizenship_status?: string | null
          country_id?: number | null
          date_of_birth?: string | null
          grade?: string | null
          interests?: string[] | null
          languages?: string[] | null
          province_id?: number | null
          residency_country_id?: number | null
          school_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          career_goals?: string[] | null
          citizenship_status?: string | null
          country_id?: number | null
          date_of_birth?: string | null
          grade?: string | null
          interests?: string[] | null
          languages?: string[] | null
          province_id?: number | null
          residency_country_id?: number | null
          school_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_residency_country_id_fkey"
            columns: ["residency_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          proficiency: number | null
          skill_id: number
          user_id: string
        }
        Insert: {
          proficiency?: number | null
          skill_id: number
          user_id: string
        }
        Update: {
          proficiency?: number | null
          skill_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      verification_log: {
        Row: {
          checked_at: string
          deadline_still_valid: boolean | null
          id: string
          link_status: number | null
          notes: string | null
          opportunity_id: string
        }
        Insert: {
          checked_at?: string
          deadline_still_valid?: boolean | null
          id?: string
          link_status?: number | null
          notes?: string | null
          opportunity_id: string
        }
        Update: {
          checked_at?: string
          deadline_still_valid?: boolean | null
          id?: string
          link_status?: number | null
          notes?: string | null
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_log_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      application_status:
        | "interested"
        | "in_progress"
        | "submitted"
        | "accepted"
        | "rejected"
        | "withdrawn"
      difficulty: "beginner" | "intermediate" | "advanced" | "competitive"
      funding_type:
        | "paid"
        | "unpaid"
        | "stipend"
        | "scholarship_award"
        | "reimbursed"
      opportunity_region_mode: "anywhere" | "single" | "multiple"
      opportunity_status:
        | "draft"
        | "pending_review"
        | "published"
        | "expired"
        | "rejected"
      opportunity_type:
        | "scholarship"
        | "internship"
        | "research"
        | "competition"
        | "fellowship"
        | "event"
        | "volunteer"
        | "certification"
        | "mentorship"
      review_status: "pending" | "approved" | "rejected" | "needs_changes"
      source_type:
        | "manual"
        | "ai_discovery"
        | "organization_submitted"
        | "import"
      user_role: "student" | "organization" | "admin"
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
      application_status: [
        "interested",
        "in_progress",
        "submitted",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      difficulty: ["beginner", "intermediate", "advanced", "competitive"],
      funding_type: [
        "paid",
        "unpaid",
        "stipend",
        "scholarship_award",
        "reimbursed",
      ],
      opportunity_region_mode: ["anywhere", "single", "multiple"],
      opportunity_status: [
        "draft",
        "pending_review",
        "published",
        "expired",
        "rejected",
      ],
      opportunity_type: [
        "scholarship",
        "internship",
        "research",
        "competition",
        "fellowship",
        "event",
        "volunteer",
        "certification",
        "mentorship",
      ],
      review_status: ["pending", "approved", "rejected", "needs_changes"],
      source_type: [
        "manual",
        "ai_discovery",
        "organization_submitted",
        "import",
      ],
      user_role: ["student", "organization", "admin"],
    },
  },
} as const
