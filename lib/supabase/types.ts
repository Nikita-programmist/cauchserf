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
      messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string | null;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_room_id_fkey';
            columns: ['room_id'];
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          }
        ];
      };
      applications: {
        Row: {
          id: string;
          host_id: string;
          guest_id: string;
          listing_id: string | null;
          message: string | null;
          status: 'pending' | 'accepted' | 'declined' | 'cancelled';
          created_at: string | null;
          room_id: string | null;
        };
        Insert: {
          id?: string;
          host_id: string;
          guest_id: string;
          listing_id?: string | null;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined' | 'cancelled';
          created_at?: string | null;
          room_id?: string | null;
        };
        Update: {
          id?: string;
          host_id?: string;
          guest_id?: string;
          listing_id?: string | null;
          message?: string | null;
          status?: 'pending' | 'accepted' | 'declined' | 'cancelled';
          created_at?: string | null;
          room_id?: string | null;
        };
        Relationships: [];
      };
      stay_requests: {
        Row: {
          id: string;
          traveler_id: string;
          host_id: string;
          listing_id: string | null;
          start_date: string | null;
          end_date: string | null;
          message: string | null;
          status: string | null;
          created_at: string | null;
          room_id: string | null;
        };
        Insert: {
          id?: string;
          traveler_id: string;
          host_id: string;
          listing_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          message?: string | null;
          status?: string | null;
          created_at?: string | null;
          room_id?: string | null;
        };
        Update: {
          id?: string;
          traveler_id?: string;
          host_id?: string;
          listing_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          message?: string | null;
          status?: string | null;
          created_at?: string | null;
          room_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stay_requests_room_id_fkey';
            columns: ['room_id'];
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          traveler_id: string;
          host_id: string;
        };
        Insert: {
          id?: string;
          traveler_id: string;
          host_id: string;
        };
        Update: {
          id?: string;
          traveler_id?: string;
          host_id?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      room_members: {
        Row: {
          room_id: string;
          user_id: string;
          role: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          role?: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'room_members_room_id_fkey';
            columns: ['room_id'];
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          name: string | null;
          avatar_url: string | null;
          city: string | null;
          age: number | null;
          gender: string | null;
          bio: string | null;
          role: string | null;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          age?: number | null;
          gender?: string | null;
          bio?: string | null;
          role?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          age?: number | null;
          gender?: string | null;
          bio?: string | null;
          role?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [key: string]: never;
    };
    Functions: {
      [key: string]: never;
    };
    Enums: {
      [key: string]: never;
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
};

