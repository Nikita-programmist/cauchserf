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
          conversation_id: string;
          sender_id: string;
          text: string;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          text: string;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          text?: string;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
      };
      stay_requests: {
        Row: {
          id: string;
          traveler_id: string;
          host_id: string;
          message: string | null;
          created_at: string | null;
          conversation_id: string | null;
        };
        Insert: {
          id?: string;
          traveler_id: string;
          host_id: string;
          message?: string | null;
          created_at?: string | null;
          conversation_id?: string | null;
        };
        Update: {
          id?: string;
          traveler_id?: string;
          host_id?: string;
          message?: string | null;
          created_at?: string | null;
          conversation_id?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          traveler_id: string;
          host_id: string;
          created_at: string;
          updated_at: string;
          last_message_text: string | null;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          traveler_id: string;
          host_id: string;
          created_at?: string;
          updated_at?: string;
          last_message_text?: string | null;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          traveler_id?: string;
          host_id?: string;
          created_at?: string;
          updated_at?: string;
          last_message_text?: string | null;
          last_message_at?: string | null;
        };
        Relationships: [];
      };
      conversation_bookings: {
        Row: {
          booking_id: string;
          conversation_id: string;
          created_at: string;
        };
        Insert: {
          booking_id: string;
          conversation_id: string;
          created_at?: string;
        };
        Update: {
          booking_id?: string;
          conversation_id?: string;
          created_at?: string;
        };
        Relationships: [];
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
      chat_rooms: {
        Row: {
          id: string;
          traveler_id: string;
          host_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          traveler_id: string;
          host_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          traveler_id?: string;
          host_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          content: string | null;
          body: string | null;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          content?: string | null;
          body?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender_id?: string;
          content?: string | null;
          body?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          name?: string | null;
          avatar_url?: string | null;
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

