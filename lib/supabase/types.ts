export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string;
          end_date: string | null;
          guest_id: string;
          host_id: string;
          id: string;
          listing_id: string | null;
          message: string | null;
          room_id: string | null;
          start_date: string | null;
          status: Database['public']['Enums']['application_status'];
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          guest_id: string;
          host_id: string;
          id?: string;
          listing_id?: string | null;
          message?: string | null;
          room_id?: string | null;
          start_date?: string | null;
          status?: Database['public']['Enums']['application_status'];
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          guest_id?: string;
          host_id?: string;
          id?: string;
          listing_id?: string | null;
          message?: string | null;
          room_id?: string | null;
          start_date?: string | null;
          status?: Database['public']['Enums']['application_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'applications_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          }
        ];
      };
      messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          room_id: string;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          room_id: string;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          room_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
            referencedSchema: 'auth';
          }
        ];
      };
      profiles: {
        Row: {
          age: number | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          first_name: string | null;
          full_name: string | null;
          gender: string | null;
          id: string;
          last_name: string | null;
          name: string | null;
          role: string | null;
        };
        Insert: {
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          gender?: string | null;
          id: string;
          last_name?: string | null;
          name?: string | null;
          role?: string | null;
        };
        Update: {
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          gender?: string | null;
          id?: string;
          last_name?: string | null;
          name?: string | null;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
            referencedSchema: 'auth';
          }
        ];
      };
      requests: {
        Row: {
          created_at: string | null;
          end_date: string;
          guest_id: string;
          host_id: string;
          id: string;
          listing_title: string | null;
          message: string | null;
          start_date: string;
        };
        Insert: {
          created_at?: string | null;
          end_date: string;
          guest_id: string;
          host_id: string;
          id?: string;
          listing_title?: string | null;
          message?: string | null;
          start_date: string;
        };
        Update: {
          created_at?: string | null;
          end_date?: string;
          guest_id?: string;
          host_id?: string;
          id?: string;
          listing_title?: string | null;
          message?: string | null;
          start_date?: string;
        };
        Relationships: [];
      };
      room_members: {
        Row: {
          role: Database['public']['Enums']['room_role'];
          room_id: string;
          user_id: string;
        };
        Insert: {
          role?: Database['public']['Enums']['room_role'];
          room_id: string;
          user_id: string;
        };
        Update: {
          role?: Database['public']['Enums']['room_role'];
          room_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'room_members_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'room_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
            referencedSchema: 'auth';
          }
        ];
      };
      rooms: {
        Row: {
          created_at: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      stay_requests: {
        Row: {
          created_at: string | null;
          end_date: string | null;
          host_id: string;
          id: string;
          listing_id: string | null;
          message: string | null;
          room_id: string | null;
          start_date: string | null;
          status: string | null;
          traveler_id: string;
        };
        Insert: {
          created_at?: string | null;
          end_date?: string | null;
          host_id: string;
          id?: string;
          listing_id?: string | null;
          message?: string | null;
          room_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          traveler_id: string;
        };
        Update: {
          created_at?: string | null;
          end_date?: string | null;
          host_id?: string;
          id?: string;
          listing_id?: string | null;
          message?: string | null;
          room_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          traveler_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stay_requests_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stay_requests_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      application_status: 'pending' | 'accepted' | 'declined' | 'cancelled';
      room_role: 'member' | 'host' | 'guest' | 'traveler';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
