export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      files: {
        Row: {
          id: string
          name: string
          original_name: string
          slug: string | null
          size: number
          mime_type: string
          category_id: string | null
          description: string | null
          storage_path: string
          public_url: string
          thumbnail_url: string | null
          preview_url: string | null
          download_count: number
          view_count: number
          like_count: number
          is_public: boolean
          is_featured: boolean
          upload_time: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          original_name: string
          slug?: string | null
          size: number
          mime_type: string
          category_id?: string | null
          description?: string | null
          storage_path: string
          public_url: string
          thumbnail_url?: string | null
          preview_url?: string | null
          download_count?: number
          view_count?: number
          like_count?: number
          is_public?: boolean
          is_featured?: boolean
          upload_time?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          original_name?: string
          slug?: string | null
          size?: number
          mime_type?: string
          category_id?: string | null
          description?: string | null
          storage_path?: string
          public_url?: string
          thumbnail_url?: string | null
          preview_url?: string | null
          download_count?: number
          view_count?: number
          like_count?: number
          is_public?: boolean
          is_featured?: boolean
          upload_time?: string
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          color: string | null
          sort_order: number
          file_count: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
          file_count?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
          file_count?: number
          is_active?: boolean
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          usage_count?: number
          created_at?: string
        }
      }
      file_tags: {
        Row: {
          file_id: string
          tag_id: string
        }
        Insert: {
          file_id: string
          tag_id: string
        }
        Update: {
          file_id?: string
          tag_id?: string
        }
      }
      user_actions: {
        Row: {
          id: string
          user_id: string | null
          file_id: string
          action_type: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          file_id: string
          action_type: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          file_id?: string
          action_type?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_download_count: {
        Args: {
          file_id: string
        }
        Returns: undefined
      }
      increment_view_count: {
        Args: {
          file_id: string
        }
        Returns: undefined
      }
      get_file_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_files: number
          total_size: number
          total_downloads: number
          total_views: number
        }[]
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
