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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      form_themes: {
        Row: {
          created_at: string
          description: string | null
          form_id: string
          id: string
          ordem: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          form_id: string
          id?: string
          ordem: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          form_id?: string
          id?: string
          ordem?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_themes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_themes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "public_active_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_themes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_counts"
            referencedColumns: ["form_id"]
          },
        ]
      }
      forms: {
        Row: {
          admin_user_id: string
          created_at: string
          description: string | null
          end_date: string | null
          form_id: string
          form_type: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          admin_user_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          form_id?: string
          form_type?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          form_id?: string
          form_type?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          admin_user_id: string
          created_at: string
          custom_options: Json | null
          discursive_placeholder: string | null
          form_id: string
          has_discursive_field: boolean | null
          id: string
          is_required: boolean | null
          ordem: number | null
          question_text: string
          question_type: string
          theme_id: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          custom_options?: Json | null
          discursive_placeholder?: string | null
          form_id: string
          has_discursive_field?: boolean | null
          id?: string
          is_required?: boolean | null
          ordem?: number | null
          question_text: string
          question_type: string
          theme_id?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          custom_options?: Json | null
          discursive_placeholder?: string | null
          form_id?: string
          has_discursive_field?: boolean | null
          id?: string
          is_required?: boolean | null
          ordem?: number | null
          question_text?: string
          question_type?: string
          theme_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "public_active_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_counts"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "questions_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "form_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "public_form_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      response_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_id: string
          resposta: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_id: string
          resposta: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
          resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "public_form_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "vw_form_responses_make"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "vw_form_responses_make"
            referencedColumns: ["response_id"]
          },
        ]
      }
      responses: {
        Row: {
          created_at: string
          form_id: string
          id: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "public_active_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_counts"
            referencedColumns: ["form_id"]
          },
        ]
      }
    }
    Views: {
      public_active_forms: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          form_type: string | null
          id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          form_type?: string | null
          id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          form_type?: string | null
          id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      public_form_questions: {
        Row: {
          custom_options: Json | null
          form_id: string | null
          has_discursive_field: boolean | null
          id: string | null
          is_required: boolean | null
          ordem: number | null
          question_text: string | null
          question_type: string | null
          theme_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "public_active_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_counts"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "questions_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "form_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "public_form_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      public_form_themes: {
        Row: {
          created_at: string | null
          description: string | null
          form_id: string | null
          id: string | null
          ordem: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_themes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_themes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "public_active_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_themes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_counts"
            referencedColumns: ["form_id"]
          },
        ]
      }
      response_counts: {
        Row: {
          form_id: string | null
          question_text: string | null
          resposta: string | null
          total_respostas: number | null
        }
        Relationships: []
      }
      vw_form_responses_make: {
        Row: {
          form_id: string | null
          question_id: string | null
          question_text: string | null
          response_id: string | null
          resposta: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "public_active_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "response_counts"
            referencedColumns: ["form_id"]
          },
        ]
      }
    }
    Functions: {
      get_active_forms_for_public: {
        Args: never
        Returns: {
          description: string
          end_date: string
          id: string
          title: string
        }[]
      }
      get_form_questions_for_public: {
        Args: { form_id_param: string }
        Returns: {
          id: string
          ordem: number
          question_text: string
          question_type: string
        }[]
      }
      get_form_responses:
        | { Args: { p_form_id: string }; Returns: Json }
        | {
            Args: never
            Returns: {
              answer: string
              answer_id: string
              form_id: string
              form_title: string
              question_text: string
              response_id: string
            }[]
          }
      get_form_responses_json: { Args: never; Returns: Json }
      get_public_form_data: {
        Args: { form_id_param: string }
        Returns: {
          description: string
          end_date: string
          id: string
          status: string
          title: string
        }[]
      }
      insert_response_answers: {
        Args: { p_answers: Json; p_response_id: string }
        Returns: undefined
      }
      insert_response_with_answers_anon: {
        Args: { p_answers: Json; p_form_id: string }
        Returns: string
      }
      is_admin_user: { Args: { user_uuid: string }; Returns: boolean }
      update_admin_user_profile: {
        Args: { new_nome: string }
        Returns: undefined
      }
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
