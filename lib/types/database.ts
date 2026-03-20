export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string;
          action: string;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email: string;
          action: string;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string;
          action?: string;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: string;
          content: string;
          sources_used: Json | null;
          tokens_used: number | null;
          model_used: string | null;
          response_time_ms: number | null;
          feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: string;
          content: string;
          sources_used?: Json | null;
          tokens_used?: number | null;
          model_used?: string | null;
          response_time_ms?: number | null;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          sources_used?: Json | null;
          tokens_used?: number | null;
          model_used?: string | null;
          response_time_ms?: number | null;
          feedback?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          title: string;
          content: string;
          category: string;
          access_level: string;
          file_name: string | null;
          file_type: string | null;
          embedding: string | null;
          chunk_index: number;
          parent_document_id: string | null;
          version: number;
          is_active: boolean;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          category: string;
          access_level?: string;
          file_name?: string | null;
          file_type?: string | null;
          embedding?: string | null;
          chunk_index?: number;
          parent_document_id?: string | null;
          version?: number;
          is_active?: boolean;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          category?: string;
          access_level?: string;
          file_name?: string | null;
          file_type?: string | null;
          embedding?: string | null;
          chunk_index?: number;
          parent_document_id?: string | null;
          version?: number;
          is_active?: boolean;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          department: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: string;
          department?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: string;
          department?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          request_count: number;
          window_start: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          request_count?: number;
          window_start?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          request_count?: number;
          window_start?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_rate_limits: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      hybrid_search: {
        Args: {
          query_text: string;
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
          p_access_level?: string;
        };
        Returns: Array<{
          id: string;
          title: string;
          content: string;
          category: string;
          score: number;
        }>;
      };
      match_documents: {
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
          p_access_level?: string;
        };
        Returns: Array<{
          id: string;
          title: string;
          content: string;
          category: string;
          similarity: number;
        }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// --- Convenience type aliases ---

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// --- Domain type aliases ---

export type UserRole = "employee" | "hr_manager" | "admin";
export type MessageRole = "user" | "assistant";
export type Feedback = "positive" | "negative";
export type DocumentCategory =
  | "policy"
  | "regulation"
  | "onboarding"
  | "faq"
  | "template"
  | "job_description"
  | "benefits"
  | "evaluation"
  | "disciplinary"
  | "payroll";
export type AccessLevel = "all" | "hr_only";
export type AuditAction =
  | "chat"
  | "document_upload"
  | "document_delete"
  | "document_update"
  | "login"
  | "logout"
  | "role_change"
  | "settings_change";

// Row type shortcuts
export type Profile = Tables<"profiles">;
export type Document = Tables<"documents">;
export type ChatSession = Tables<"chat_sessions">;
export type ChatMessage = Tables<"chat_messages">;
export type AuditLog = Tables<"audit_logs">;
export type RateLimit = Tables<"rate_limits">;
