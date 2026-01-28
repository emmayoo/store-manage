export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RecordType = 'shift' | 'note' | 'order' | 'expiry'

export type StoreRole = 'owner' | 'manager' | 'staff'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'
export type JoinRequestVia = 'search' | 'code'

export type Database = {
  public: {
    Tables: {
      records: {
        Row: {
          id: string
          store_id: string | null
          type: RecordType
          title: string | null
          content: string | null
          starts_at: string | null
          ends_at: string | null
          payload: Json | null
          created_by: string
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id?: string | null
          type: RecordType
          title?: string | null
          content?: string | null
          starts_at?: string | null
          ends_at?: string | null
          payload?: Json | null
          created_by: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          store_id?: string | null
          type?: RecordType
          title?: string | null
          content?: string | null
          starts_at?: string | null
          ends_at?: string | null
          payload?: Json | null
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          name: string
          address: string | null
          business_number: string | null
          phone: string | null
          is_public: boolean
          invite_code: string
          created_by: string
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          business_number?: string | null
          phone?: string | null
          is_public?: boolean
          invite_code?: string
          created_by: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          address?: string | null
          business_number?: string | null
          phone?: string | null
          is_public?: boolean
          invite_code?: string
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_members: {
        Row: {
          store_id: string
          user_id: string
          role: StoreRole
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          store_id: string
          user_id: string
          role?: StoreRole
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: StoreRole
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_join_requests: {
        Row: {
          id: string
          store_id: string
          user_id: string
          status: JoinRequestStatus
          via: JoinRequestVia
          message: string | null
          decided_by: string | null
          decided_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          user_id: string
          status?: JoinRequestStatus
          via?: JoinRequestVia
          message?: string | null
          decided_by?: string | null
          decided_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: JoinRequestStatus
          decided_by?: string | null
          decided_at?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          user_id: string
          display_name: string | null
          birth_date: string | null
          phone: string | null
          avatar_path: string | null
          color: string | null
          memo: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          birth_date?: string | null
          phone?: string | null
          avatar_path?: string | null
          color?: string | null
          memo?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          birth_date?: string | null
          phone?: string | null
          avatar_path?: string | null
          color?: string | null
          memo?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_store_by_invite_code: {
        Args: { p_code: string }
        Returns: Array<{ id: string; name: string; is_public: boolean }>
      }
      rotate_store_invite_code: {
        Args: { p_store_id: string }
        Returns: string
      }
      approve_store_join_request: {
        Args: { p_request_id: string; p_role: StoreRole }
        Returns: void
      }
      reject_store_join_request: {
        Args: { p_request_id: string }
        Returns: void
      }
      soft_delete_store: {
        Args: { p_store_id: string }
        Returns: void
      }
      set_store_member_role: {
        Args: { p_store_id: string; p_user_id: string; p_role: StoreRole }
        Returns: void
      }
      soft_delete_store_member: {
        Args: { p_store_id: string; p_user_id: string }
        Returns: void
      }
    }
    Enums: {
      record_type: RecordType
      store_role: StoreRole
      join_request_status: JoinRequestStatus
      join_request_via: JoinRequestVia
    }
    CompositeTypes: Record<string, never>
  }
}

