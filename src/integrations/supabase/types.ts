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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      custom_foods: {
        Row: {
          athlete_id: string
          biotin_b7: number | null
          carbs: number | null
          created_at: string
          energy_kcal: number | null
          energy_kj: number | null
          fat: number | null
          fiber: number | null
          folic_acid_b9: number | null
          id: string
          name: string
          niacin_b3: number | null
          pantothenic_acid_b5: number | null
          protein: number | null
          riboflavin_b2: number | null
          salt: number | null
          saturated_fat: number | null
          sugars: number | null
          thiamine_b1: number | null
          updated_at: string
          vitamin_a: number | null
          vitamin_b12: number | null
          vitamin_b6: number | null
          vitamin_c: number | null
          vitamin_d: number | null
          vitamin_e: number | null
          vitamin_k: number | null
        }
        Insert: {
          athlete_id: string
          biotin_b7?: number | null
          carbs?: number | null
          created_at?: string
          energy_kcal?: number | null
          energy_kj?: number | null
          fat?: number | null
          fiber?: number | null
          folic_acid_b9?: number | null
          id?: string
          name: string
          niacin_b3?: number | null
          pantothenic_acid_b5?: number | null
          protein?: number | null
          riboflavin_b2?: number | null
          salt?: number | null
          saturated_fat?: number | null
          sugars?: number | null
          thiamine_b1?: number | null
          updated_at?: string
          vitamin_a?: number | null
          vitamin_b12?: number | null
          vitamin_b6?: number | null
          vitamin_c?: number | null
          vitamin_d?: number | null
          vitamin_e?: number | null
          vitamin_k?: number | null
        }
        Update: {
          athlete_id?: string
          biotin_b7?: number | null
          carbs?: number | null
          created_at?: string
          energy_kcal?: number | null
          energy_kj?: number | null
          fat?: number | null
          fiber?: number | null
          folic_acid_b9?: number | null
          id?: string
          name?: string
          niacin_b3?: number | null
          pantothenic_acid_b5?: number | null
          protein?: number | null
          riboflavin_b2?: number | null
          salt?: number | null
          saturated_fat?: number | null
          sugars?: number | null
          thiamine_b1?: number | null
          updated_at?: string
          vitamin_a?: number | null
          vitamin_b12?: number | null
          vitamin_b6?: number | null
          vitamin_c?: number | null
          vitamin_d?: number | null
          vitamin_e?: number | null
          vitamin_k?: number | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          created_at: string
          date: string
          hrv_rmssd: number | null
          id: string
          notes: string | null
          resting_hr: number | null
          sleep_hours: number | null
          subjective_readiness: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          hrv_rmssd?: number | null
          id?: string
          notes?: string | null
          resting_hr?: number | null
          sleep_hours?: number | null
          subjective_readiness?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          hrv_rmssd?: number | null
          id?: string
          notes?: string | null
          resting_hr?: number | null
          sleep_hours?: number | null
          subjective_readiness?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      daily_readiness: {
        Row: {
          athlete_id: string
          body_weight: number | null
          created_at: string
          date: string
          digestion: number | null
          energy: number | null
          has_pain: boolean | null
          id: string
          mood: number | null
          notes: string | null
          score: number | null
          sleep_hours: number | null
          sleep_quality: number | null
          soreness_map: Json | null
          stress_level: number | null
        }
        Insert: {
          athlete_id: string
          body_weight?: number | null
          created_at?: string
          date?: string
          digestion?: number | null
          energy?: number | null
          has_pain?: boolean | null
          id?: string
          mood?: number | null
          notes?: string | null
          score?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_map?: Json | null
          stress_level?: number | null
        }
        Update: {
          athlete_id?: string
          body_weight?: number | null
          created_at?: string
          date?: string
          digestion?: number | null
          energy?: number | null
          has_pain?: boolean | null
          id?: string
          mood?: number | null
          notes?: string | null
          score?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_map?: Json | null
          stress_level?: number | null
        }
        Relationships: []
      }
      fms_tests: {
        Row: {
          active_straight_leg_l: number | null
          active_straight_leg_r: number | null
          athlete_id: string
          created_at: string
          deep_squat: number | null
          hurdle_step_l: number | null
          hurdle_step_r: number | null
          id: string
          inline_lunge_l: number | null
          inline_lunge_r: number | null
          notes: string | null
          rotary_stability_l: number | null
          rotary_stability_r: number | null
          shoulder_mobility_l: number | null
          shoulder_mobility_r: number | null
          test_date: string
          trunk_stability: number | null
        }
        Insert: {
          active_straight_leg_l?: number | null
          active_straight_leg_r?: number | null
          athlete_id: string
          created_at?: string
          deep_squat?: number | null
          hurdle_step_l?: number | null
          hurdle_step_r?: number | null
          id?: string
          inline_lunge_l?: number | null
          inline_lunge_r?: number | null
          notes?: string | null
          rotary_stability_l?: number | null
          rotary_stability_r?: number | null
          shoulder_mobility_l?: number | null
          shoulder_mobility_r?: number | null
          test_date?: string
          trunk_stability?: number | null
        }
        Update: {
          active_straight_leg_l?: number | null
          active_straight_leg_r?: number | null
          athlete_id?: string
          created_at?: string
          deep_squat?: number | null
          hurdle_step_l?: number | null
          hurdle_step_r?: number | null
          id?: string
          inline_lunge_l?: number | null
          inline_lunge_r?: number | null
          notes?: string | null
          rotary_stability_l?: number | null
          rotary_stability_r?: number | null
          shoulder_mobility_l?: number | null
          shoulder_mobility_r?: number | null
          test_date?: string
          trunk_stability?: number | null
        }
        Relationships: []
      }
      injuries: {
        Row: {
          athlete_id: string
          body_zone: string
          created_at: string
          description: string | null
          id: string
          injury_date: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          body_zone: string
          created_at?: string
          description?: string | null
          id?: string
          injury_date?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          body_zone?: string
          created_at?: string
          description?: string | null
          id?: string
          injury_date?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          athlete_id: string
          calories: number | null
          carbs: number | null
          created_at: string
          date: string
          fats: number | null
          id: string
          logged_at: string
          meal_name: string | null
          notes: string | null
          protein: number | null
          water: number | null
        }
        Insert: {
          athlete_id: string
          calories?: number | null
          carbs?: number | null
          created_at?: string
          date?: string
          fats?: number | null
          id?: string
          logged_at?: string
          meal_name?: string | null
          notes?: string | null
          protein?: number | null
          water?: number | null
        }
        Update: {
          athlete_id?: string
          calories?: number | null
          carbs?: number | null
          created_at?: string
          date?: string
          fats?: number | null
          id?: string
          logged_at?: string
          meal_name?: string | null
          notes?: string | null
          protein?: number | null
          water?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coach_id: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed: boolean
          one_rm_data: Json | null
          role: Database["public"]["Enums"]["user_role"]
          settings: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          one_rm_data?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          settings?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          one_rm_data?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_phases: {
        Row: {
          athlete_id: string
          base_volume: number
          coach_id: string
          created_at: string
          end_date: string
          focus_type: Database["public"]["Enums"]["phase_focus_type"]
          id: string
          name: string
          notes: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          base_volume?: number
          coach_id: string
          created_at?: string
          end_date: string
          focus_type: Database["public"]["Enums"]["phase_focus_type"]
          id?: string
          name: string
          notes?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          base_volume?: number
          coach_id?: string
          created_at?: string
          end_date?: string
          focus_type?: Database["public"]["Enums"]["phase_focus_type"]
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          exercise_order: number
          id: string
          notes: string | null
          sets_data: Json
          updated_at: string
          workout_log_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          exercise_order?: number
          id?: string
          notes?: string | null
          sets_data?: Json
          updated_at?: string
          workout_log_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          exercise_order?: number
          id?: string
          notes?: string | null
          sets_data?: Json
          updated_at?: string
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          athlete_id: string
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          duration_seconds: number | null
          exercises_data: Json
          id: string
          local_id: string | null
          notes: string | null
          program_id: string | null
          rpe_global: number | null
          srpe: number | null
          started_at: string | null
          sync_status: string
          total_load_au: number | null
          workout_id: string
        }
        Insert: {
          athlete_id: string
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          duration_seconds?: number | null
          exercises_data?: Json
          id?: string
          local_id?: string | null
          notes?: string | null
          program_id?: string | null
          rpe_global?: number | null
          srpe?: number | null
          started_at?: string | null
          sync_status?: string
          total_load_au?: number | null
          workout_id: string
        }
        Update: {
          athlete_id?: string
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          duration_seconds?: number | null
          exercises_data?: Json
          id?: string
          local_id?: string | null
          notes?: string | null
          program_id?: string | null
          rpe_global?: number | null
          srpe?: number | null
          started_at?: string | null
          sync_status?: string
          total_load_au?: number | null
          workout_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          athlete_id: string
          coach_id: string | null
          created_at: string
          description: string | null
          estimated_duration: number | null
          id: string
          scheduled_date: string | null
          status: Database["public"]["Enums"]["workout_status"]
          structure: Json
          title: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          coach_id?: string | null
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["workout_status"]
          structure?: Json
          title: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string | null
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          id?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["workout_status"]
          structure?: Json
          title?: string
          updated_at?: string
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
      phase_focus_type:
        | "strength"
        | "hypertrophy"
        | "endurance"
        | "power"
        | "recovery"
        | "peaking"
        | "transition"
      user_role: "coach" | "athlete"
      workout_status: "pending" | "in_progress" | "completed" | "skipped"
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
      phase_focus_type: [
        "strength",
        "hypertrophy",
        "endurance",
        "power",
        "recovery",
        "peaking",
        "transition",
      ],
      user_role: ["coach", "athlete"],
      workout_status: ["pending", "in_progress", "completed", "skipped"],
    },
  },
} as const
