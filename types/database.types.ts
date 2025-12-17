// Type definitions for Supabase Database Tables

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          store_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          store_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          store_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Profile type for use in components
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Auth action result types
export interface AuthResult {
  error?: string;
  type?: string;
}

export interface ProfileResult {
  error: string | null;
  user: any;
  profile: Profile | null;
}
