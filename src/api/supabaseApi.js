// =============================================================
// Supabase バックエンド（local.js と同一インターフェース）
//   VITE_BACKEND=supabase かつ URL/anon キーが設定されたときに使われる。
// =============================================================
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);
export const backendName = 'supabase';

const supabase = isConfigured ? createClient(url, anonKey) : null;

function deriveType(index, total) {
  if (index === 0) return 'start';
  if (index === total - 1) return 'goal';
  return 'middle';
}

export const auth = {
  async getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(callback) {
    // Supabase は (event, session) を渡すので session のみに正規化
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
  },

  async signUp(email, password, name) {
    return supabase.auth.signUp({ email, password, options: { data: { name } } });
  },

  async signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    return supabase.auth.signOut();
  },
};

export const data = {
  async listRoutes(prefectureCode) {
    let query = supabase
      .from('routes')
      .select('id, title, summary, prefecture_code, created_at, profiles(name), route_likes(count)')
      .order('created_at', { ascending: false });
    if (prefectureCode) query = query.eq('prefecture_code', prefectureCode);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      ...r,
      author_name: r.profiles?.name ?? '不明',
      like_count: r.route_likes?.[0]?.count ?? 0,
    }));
  },

  async getRoute(id, currentUserId) {
    const { data: r, error } = await supabase
      .from('routes')
      .select('id, user_id, title, summary, description, prefecture_code, created_at, profiles(name)')
      .eq('id', id)
      .single();
    if (error) return { data: null, error };

    const { data: points } = await supabase
      .from('route_points')
      .select('point_type, seq, label, lat, lng')
      .eq('route_id', id)
      .order('seq', { ascending: true });

    const { count } = await supabase
      .from('route_likes')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', id);

    let liked = false;
    if (currentUserId) {
      const { data: mine } = await supabase
        .from('route_likes')
        .select('id')
        .eq('route_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle();
      liked = !!mine;
    }

    return {
      data: {
        ...r,
        author_name: r.profiles?.name ?? '不明',
        points: points ?? [],
        like_count: count ?? 0,
        liked,
      },
      error: null,
    };
  },

  async createRoute(currentUserId, { title, summary, description, prefecture_code, points }) {
    const { data: route, error } = await supabase
      .from('routes')
      .insert({ user_id: currentUserId, title, summary, description, prefecture_code: prefecture_code || null })
      .select()
      .single();
    if (error) return { data: null, error };

    const rows = points.map((p, i) => ({
      route_id: route.id,
      point_type: deriveType(i, points.length),
      seq: i,
      label: p.label || null,
      lat: p.lat,
      lng: p.lng,
    }));
    const { error: pErr } = await supabase.from('route_points').insert(rows);
    if (pErr) return { data: null, error: pErr };

    return { data: { id: route.id }, error: null };
  },

  async deleteRoute(id) {
    return supabase.from('routes').delete().eq('id', id);
  },

  async toggleLike(id, currentUserId) {
    const { data: mine } = await supabase
      .from('route_likes')
      .select('id')
      .eq('route_id', id)
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (mine) {
      await supabase.from('route_likes').delete().eq('id', mine.id);
    } else {
      await supabase.from('route_likes').insert({ route_id: Number(id), user_id: currentUserId });
    }
    const { count } = await supabase
      .from('route_likes')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', id);
    return { liked: !mine, like_count: count ?? 0 };
  },
};
