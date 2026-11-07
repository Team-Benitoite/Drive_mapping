/**
 * `supabase/schema.sql` に対応する型定義です。
 * スキーマを変更したときは、このファイルも合わせて更新してください。
 */

export type PointType = 'start' | 'middle' | 'goal';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_path: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      routes: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          summary: string | null;
          description: string | null;
          address: string | null;
          site_url: string | null;
          google_maps_url: string | null;
          prefecture_code: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          title: string;
          summary?: string | null;
          description?: string | null;
          address?: string | null;
          site_url?: string | null;
          google_maps_url?: string | null;
          prefecture_code: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          title?: string;
          summary?: string | null;
          description?: string | null;
          address?: string | null;
          site_url?: string | null;
          google_maps_url?: string | null;
          prefecture_code?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'routes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      route_prefectures: {
        Row: {
          id: number;
          route_id: number;
          prefecture_code: number;
          is_main: boolean;
        };
        Insert: {
          id?: number;
          route_id: number;
          prefecture_code: number;
          is_main?: boolean;
        };
        Update: {
          id?: number;
          route_id?: number;
          prefecture_code?: number;
          is_main?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'route_prefectures_route_id_fkey';
            columns: ['route_id'];
            isOneToOne: false;
            referencedRelation: 'routes';
            referencedColumns: ['id'];
          },
        ];
      };
      route_points: {
        Row: {
          id: number;
          route_id: number;
          point_type: PointType;
          label: string | null;
          address: string | null;
          sort_order: number;
        };
        Insert: {
          id?: number;
          route_id: number;
          point_type: PointType;
          label?: string | null;
          address?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: number;
          route_id?: number;
          point_type?: PointType;
          label?: string | null;
          address?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'route_points_route_id_fkey';
            columns: ['route_id'];
            isOneToOne: false;
            referencedRelation: 'routes';
            referencedColumns: ['id'];
          },
        ];
      };
      route_photos: {
        Row: {
          id: number;
          route_id: number;
          storage_path: string;
          thumb_path: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          route_id: number;
          storage_path: string;
          thumb_path?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          route_id?: number;
          storage_path?: string;
          thumb_path?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'route_photos_route_id_fkey';
            columns: ['route_id'];
            isOneToOne: false;
            referencedRelation: 'routes';
            referencedColumns: ['id'];
          },
        ];
      };
      route_likes: {
        Row: {
          id: number;
          route_id: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          route_id: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          route_id?: number;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'route_likes_route_id_fkey';
            columns: ['route_id'];
            isOneToOne: false;
            referencedRelation: 'routes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'route_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_follows: {
        Row: {
          id: number;
          follower_id: string;
          followee_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          follower_id: string;
          followee_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          follower_id?: string;
          followee_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profile_follows_followee_id_fkey';
            columns: ['followee_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      point_type: PointType;
    };
    CompositeTypes: Record<never, never>;
  };
}

export type Tables<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Row'];

export type TablesInsert<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Insert'];
