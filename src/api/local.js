// =============================================================
// ローカルバックエンド（localStorage 実装）
//   外部サービス不要でそのまま動く。Supabase 実装と同じインターフェースを
//   提供するため、VITE_BACKEND を切り替えるだけで差し替えられる。
//   ※パスワードを平文保存する簡易実装。学習・デモ用途のみ。
// =============================================================

const KEYS = {
  users: 'dm_users',
  routes: 'dm_routes',
  points: 'dm_points',
  likes: 'dm_likes',
  session: 'dm_session',
  seq: 'dm_seq',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// 自動採番（routes / points / likes 用）
function nextId(name) {
  const seq = read(KEYS.seq, {});
  const id = (seq[name] ?? 0) + 1;
  seq[name] = id;
  write(KEYS.seq, seq);
  return id;
}

function deriveType(index, total) {
  if (index === 0) return 'start';
  if (index === total - 1) return 'goal';
  return 'middle';
}

// --- 認証状態の購読 ------------------------------------------------
const listeners = new Set();
function notify() {
  const session = read(KEYS.session, null);
  listeners.forEach((cb) => cb(session));
}

export const isConfigured = true;
export const backendName = 'local';

export const auth = {
  async getSession() {
    return { data: { session: read(KEYS.session, null) } };
  },

  onAuthStateChange(callback) {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe() {
            listeners.delete(callback);
          },
        },
      },
    };
  },

  async signUp(email, password, name) {
    const users = read(KEYS.users, []);
    if (users.some((u) => u.email === email)) {
      return { data: null, error: { message: 'このメールアドレスは既に登録されています。' } };
    }
    const user = { id: crypto.randomUUID(), email, password, name };
    users.push(user);
    write(KEYS.users, users);

    const session = makeSession(user);
    write(KEYS.session, session);
    notify();
    return { data: { session }, error: null };
  },

  async signIn(email, password) {
    const users = read(KEYS.users, []);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      return { data: null, error: { message: 'メールアドレスまたはパスワードが正しくありません。' } };
    }
    const session = makeSession(user);
    write(KEYS.session, session);
    notify();
    return { data: { session }, error: null };
  },

  async signOut() {
    localStorage.removeItem(KEYS.session);
    notify();
  },
};

function makeSession(user) {
  return { user: { id: user.id, email: user.email, user_metadata: { name: user.name } } };
}

function userName(userId) {
  const users = read(KEYS.users, []);
  return users.find((u) => u.id === userId)?.name ?? '不明';
}

// --- データ操作 ----------------------------------------------------
export const data = {
  async listRoutes(prefectureCode) {
    let routes = read(KEYS.routes, []);
    if (prefectureCode) routes = routes.filter((r) => r.prefecture_code === prefectureCode);
    const likes = read(KEYS.likes, []);

    return routes
      .map((r) => ({
        ...r,
        author_name: userName(r.user_id),
        like_count: likes.filter((l) => l.route_id === r.id).length,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getRoute(id, currentUserId) {
    const routeId = Number(id);
    const route = read(KEYS.routes, []).find((r) => r.id === routeId);
    if (!route) return { data: null, error: { message: 'ルートが見つかりません。' } };

    const points = read(KEYS.points, [])
      .filter((p) => p.route_id === routeId)
      .sort((a, b) => a.seq - b.seq);
    const likes = read(KEYS.likes, []).filter((l) => l.route_id === routeId);

    return {
      data: {
        ...route,
        author_name: userName(route.user_id),
        points,
        like_count: likes.length,
        liked: currentUserId ? likes.some((l) => l.user_id === currentUserId) : false,
      },
      error: null,
    };
  },

  async createRoute(currentUserId, { title, summary, description, prefecture_code, points }) {
    const id = nextId('routes');
    const route = {
      id,
      user_id: currentUserId,
      title,
      summary: summary || null,
      description: description || null,
      prefecture_code: prefecture_code || null,
      created_at: new Date().toISOString(),
    };
    const routes = read(KEYS.routes, []);
    routes.push(route);
    write(KEYS.routes, routes);

    const allPoints = read(KEYS.points, []);
    points.forEach((p, i) => {
      allPoints.push({
        id: nextId('points'),
        route_id: id,
        point_type: deriveType(i, points.length),
        seq: i,
        label: p.label || null,
        lat: p.lat,
        lng: p.lng,
      });
    });
    write(KEYS.points, allPoints);

    return { data: { id }, error: null };
  },

  async deleteRoute(id) {
    const routeId = Number(id);
    write(KEYS.routes, read(KEYS.routes, []).filter((r) => r.id !== routeId));
    write(KEYS.points, read(KEYS.points, []).filter((p) => p.route_id !== routeId));
    write(KEYS.likes, read(KEYS.likes, []).filter((l) => l.route_id !== routeId));
    return { error: null };
  },

  async toggleLike(id, currentUserId) {
    const routeId = Number(id);
    let likes = read(KEYS.likes, []);
    const existing = likes.find((l) => l.route_id === routeId && l.user_id === currentUserId);
    if (existing) {
      likes = likes.filter((l) => l !== existing);
    } else {
      likes.push({ id: nextId('likes'), route_id: routeId, user_id: currentUserId });
    }
    write(KEYS.likes, likes);
    const forRoute = likes.filter((l) => l.route_id === routeId);
    return {
      liked: forRoute.some((l) => l.user_id === currentUserId),
      like_count: forRoute.length,
    };
  },
};
