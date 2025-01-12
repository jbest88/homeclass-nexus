export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      archived_lessons: {
        Row: {
          archived_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          archived_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          archived_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archived_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_study_stats: {
        Row: {
          average_proficiency: number
          correct_answers: number
          created_at: string
          date: string
          id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          average_proficiency?: number
          correct_answers?: number
          created_at?: string
          date?: string
          id?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          average_proficiency?: number
          correct_answers?: number
          created_at?: string
          date?: string
          id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      features: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      generated_lessons: {
        Row: {
          content: string
          created_at: string
          id: string
          order_index: number
          questions: Json
          subject: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          order_index: number
          questions: Json
          subject: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          questions?: Json
          subject?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      interest_points: {
        Row: {
          created_at: string
          id: string
          level: number
          points: number
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          points?: number
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          points?: number
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_modules: {
        Row: {
          content: string
          created_at: string
          id: string
          order_index: number
          subject: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          order_index: number
          subject: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          subject?: string
          title?: string
        }
        Relationships: []
      }
      learning_path_lessons: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          order_index: number
          path_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          order_index: number
          path_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          order_index?: number
          path_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_lessons_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          id: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_section_progress: {
        Row: {
          completed_sections: number[] | null
          created_at: string | null
          current_section: number
          id: string
          last_accessed_at: string | null
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_sections?: number[] | null
          created_at?: string | null
          current_section?: number
          id?: string
          last_accessed_at?: string | null
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_sections?: number[] | null
          created_at?: string | null
          current_section?: number
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_section_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lesson_id: string
          title: string
          video_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id: string
          title: string
          video_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string
          title?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_videos_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          city: string | null
          country: string | null
          grade_level: number | null
          grade_override: number | null
          id: string
          interests: string[] | null
          language_preference: string | null
          notification_preferences: Json | null
          portfolio_items: Json[] | null
          privacy_settings: Json | null
          skills: string[] | null
          social_links: Json | null
          state_province: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          grade_level?: number | null
          grade_override?: number | null
          id: string
          interests?: string[] | null
          language_preference?: string | null
          notification_preferences?: Json | null
          portfolio_items?: Json[] | null
          privacy_settings?: Json | null
          skills?: string[] | null
          social_links?: Json | null
          state_province?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          grade_level?: number | null
          grade_override?: number | null
          id?: string
          interests?: string[] | null
          language_preference?: string | null
          notification_preferences?: Json | null
          portfolio_items?: Json[] | null
          privacy_settings?: Json | null
          skills?: string[] | null
          social_links?: Json | null
          state_province?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      question_help: {
        Row: {
          created_at: string
          explanation: string
          id: string
          lesson_id: string
          question_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          explanation: string
          id?: string
          lesson_id: string
          question_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          explanation?: string
          id?: string
          lesson_id?: string
          question_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_help_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      question_responses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          lesson_id: string
          question_index: number
          response_time: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          lesson_id: string
          question_index: number
          response_time: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          lesson_id?: string
          question_index?: number
          response_time?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "generated_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_proficiency: {
        Row: {
          correct_answers: number
          id: string
          proficiency_level: number
          subject: string
          total_questions_attempted: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_answers?: number
          id?: string
          proficiency_level?: number
          subject: string
          total_questions_attempted?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_answers?: number
          id?: string
          proficiency_level?: number
          subject?: string
          total_questions_attempted?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tier_features: {
        Row: {
          created_at: string
          feature_code: string
          id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string
          feature_code: string
          id?: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string
          feature_code?: string
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "tier_features_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["code"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          started_at: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_feature_access: {
        Args: {
          user_id: string
          feature_code: string
        }
        Returns: boolean
      }
    }
    Enums: {
      subscription_tier: "free" | "basic" | "premium" | "enterprise"
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
