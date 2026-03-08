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
      ai_interview_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interview_summaries: {
        Row: {
          created_at: string
          id: string
          key_insights: Json | null
          session_id: string
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_insights?: Json | null
          session_id: string
          summary: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_insights?: Json | null
          session_id?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          session_id: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          session_id: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      hearing_requests: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          estimated_duration: number | null
          id: string
          instructions: string | null
          max_participants: number | null
          project_id: string | null
          reward_amount: number | null
          reward_per_user: number | null
          reward_type: string | null
          status: Database["public"]["Enums"]["hearing_status"]
          target_url: string
          thumbnail_path: string | null
          title: string
          total_budget_cap: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          max_participants?: number | null
          project_id?: string | null
          reward_amount?: number | null
          reward_per_user?: number | null
          reward_type?: string | null
          status?: Database["public"]["Enums"]["hearing_status"]
          target_url: string
          thumbnail_path?: string | null
          title: string
          total_budget_cap?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          max_participants?: number | null
          project_id?: string | null
          reward_amount?: number | null
          reward_per_user?: number | null
          reward_type?: string | null
          status?: Database["public"]["Enums"]["hearing_status"]
          target_url?: string
          thumbnail_path?: string | null
          title?: string
          total_budget_cap?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hearing_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hearing_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_personas: {
        Row: {
          age_max: number | null
          age_min: number | null
          country: string | null
          created_at: string
          details: string | null
          gender: string | null
          hearing_request_id: string
          id: string
          occupation: string | null
          updated_at: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          country?: string | null
          created_at?: string
          details?: string | null
          gender?: string | null
          hearing_request_id: string
          id?: string
          occupation?: string | null
          updated_at?: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          country?: string | null
          created_at?: string
          details?: string | null
          gender?: string | null
          hearing_request_id?: string
          id?: string
          occupation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_personas_hearing_request_id_fkey"
            columns: ["hearing_request_id"]
            isOneToOne: true
            referencedRelation: "hearing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_preparations: {
        Row: {
          content: string
          created_at: string
          hearing_request_id: string
          id: string
          sort_order: number
        }
        Insert: {
          content: string
          created_at?: string
          hearing_request_id: string
          id?: string
          sort_order?: number
        }
        Update: {
          content?: string
          created_at?: string
          hearing_request_id?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_preparations_hearing_request_id_fkey"
            columns: ["hearing_request_id"]
            isOneToOne: false
            referencedRelation: "hearing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          hearing_request_id: string
          id: string
          sdk_initialized_at: string | null
          sdk_last_activity_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          hearing_request_id: string
          id?: string
          sdk_initialized_at?: string | null
          sdk_last_activity_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          hearing_request_id?: string
          id?: string
          sdk_initialized_at?: string | null
          sdk_last_activity_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_hearing_request_id_fkey"
            columns: ["hearing_request_id"]
            isOneToOne: false
            referencedRelation: "hearing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_todos: {
        Row: {
          content: string
          created_at: string
          hearing_request_id: string
          id: string
          sort_order: number
        }
        Insert: {
          content: string
          created_at?: string
          hearing_request_id: string
          id?: string
          sort_order?: number
        }
        Update: {
          content?: string
          created_at?: string
          hearing_request_id?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_todos_hearing_request_id_fkey"
            columns: ["hearing_request_id"]
            isOneToOne: false
            referencedRelation: "hearing_requests"
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
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          purpose: string | null
          target_user: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          purpose?: string | null
          target_user?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          purpose?: string | null
          target_user?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          created_at: string
          duration: number | null
          file_size: number | null
          id: string
          recording_type: string
          session_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          file_size?: number | null
          id?: string
          recording_type: string
          session_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          file_size?: number | null
          id?: string
          recording_type?: string
          session_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sdk_events: {
        Row: {
          created_at: string
          elapsed_ms: number
          event_type: string
          id: string
          metadata: Json | null
          page_title: string | null
          page_url: string
          scroll_depth: number | null
          session_id: string
          target_selector: string | null
          timestamp: string
          viewport_height: number | null
          viewport_width: number | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          created_at?: string
          elapsed_ms: number
          event_type: string
          id?: string
          metadata?: Json | null
          page_title?: string | null
          page_url: string
          scroll_depth?: number | null
          session_id: string
          target_selector?: string | null
          timestamp?: string
          viewport_height?: number | null
          viewport_width?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          created_at?: string
          elapsed_ms?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          page_title?: string | null
          page_url?: string
          scroll_depth?: number | null
          session_id?: string
          target_selector?: string | null
          timestamp?: string
          viewport_height?: number | null
          viewport_width?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sdk_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_question_options: {
        Row: {
          created_at: string
          id: string
          label: string
          question_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          question_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "survey_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string
          hearing_request_id: string
          id: string
          phase: Database["public"]["Enums"]["survey_phase"]
          question: string
          question_type: Database["public"]["Enums"]["survey_question_type"]
          sort_order: number
        }
        Insert: {
          created_at?: string
          hearing_request_id: string
          id?: string
          phase: Database["public"]["Enums"]["survey_phase"]
          question: string
          question_type?: Database["public"]["Enums"]["survey_question_type"]
          sort_order?: number
        }
        Update: {
          created_at?: string
          hearing_request_id?: string
          id?: string
          phase?: Database["public"]["Enums"]["survey_phase"]
          question?: string
          question_type?: Database["public"]["Enums"]["survey_question_type"]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_hearing_request_id_fkey"
            columns: ["hearing_request_id"]
            isOneToOne: false
            referencedRelation: "hearing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_response_selections: {
        Row: {
          created_at: string
          id: string
          option_id: string
          response_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          response_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_response_selections_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "survey_question_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_response_selections_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          id: string
          question_id: string
          session_id: string
          text_value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          session_id: string
          text_value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          session_id?: string
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_hearing: {
        Args: {
          check_hearing_id: string
        }
        Returns: boolean
      }
      can_access_session: {
        Args: {
          check_session_id: string
        }
        Returns: boolean
      }
      can_access_survey_question: {
        Args: {
          check_question_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: {
          check_company_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: {
          check_company_id: string
        }
        Returns: boolean
      }
      is_company_owner: {
        Args: {
          check_company_id: string
        }
        Returns: boolean
      }
      is_hearing_company_member: {
        Args: {
          check_hearing_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: {
          check_project_id: string
        }
        Returns: boolean
      }
      is_survey_question_company_member: {
        Args: {
          check_question_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      hearing_status: "draft" | "active" | "paused" | "completed" | "archived"
      session_status:
        | "pending"
        | "recording"
        | "interview"
        | "completed"
        | "cancelled"
      survey_phase: "pre_survey" | "feedback"
      survey_question_type: "text" | "radio" | "checkbox"
      user_role: "user" | "company" | "admin"
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

