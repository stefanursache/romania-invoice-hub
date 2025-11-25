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
      accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          cui_cif: string | null
          email: string | null
          id: string
          name: string
          payment_terms: number | null
          phone: string | null
          reg_com: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          cui_cif?: string | null
          email?: string | null
          id?: string
          name: string
          payment_terms?: number | null
          phone?: string | null
          reg_com?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          cui_cif?: string | null
          email?: string | null
          id?: string
          name?: string
          payment_terms?: number | null
          phone?: string | null
          reg_com?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          subtotal?: number
          total?: number
          unit_price?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          currency: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string
          vat_amount: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id: string
          vat_amount?: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          bank_account: string | null
          city: string | null
          company_name: string
          country: string | null
          county: string | null
          created_at: string | null
          cui_cif: string | null
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          reg_com: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          city?: string | null
          company_name: string
          country?: string | null
          county?: string | null
          created_at?: string | null
          cui_cif?: string | null
          email?: string | null
          id: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          reg_com?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          city?: string | null
          company_name?: string
          country?: string | null
          county?: string | null
          created_at?: string | null
          cui_cif?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          reg_com?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saft_exports: {
        Row: {
          created_at: string | null
          file_data: string
          generated_at: string | null
          id: string
          period_from: string
          period_to: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_data: string
          generated_at?: string | null
          id?: string
          period_from: string
          period_to: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_data?: string
          generated_at?: string | null
          id?: string
          period_from?: string
          period_to?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          member_user_id: string
          role: Database["public"]["Enums"]["app_role"]
          workspace_owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          member_user_id: string
          role?: Database["public"]["Enums"]["app_role"]
          workspace_owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          member_user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          workspace_owner_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_workspace_role: {
        Args: { _user_id: string; _workspace_owner_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_workspace_access: {
        Args: { _user_id: string; _workspace_owner_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "accountant"
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
      app_role: ["owner", "accountant"],
    },
  },
} as const
