import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// 画面ごとにチャンク分割（コード分割）。
// 地図ライブラリ（Leaflet）を含む画面は遅延読み込みされるため、
// 一覧の閲覧だけなら Leaflet をダウンロードしない＝通信量を削減できる。
const Index = lazy(() => import('./pages/Index'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const RouteCreate = lazy(() => import('./pages/RouteCreate'));
const RouteDetail = lazy(() => import('./pages/RouteDetail'));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<p className="muted">読み込み中…</p>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/routes/:id" element={<RouteDetail />} />
          <Route
            path="/routes/new"
            element={
              <ProtectedRoute>
                <RouteCreate />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<p>ページが見つかりません。</p>} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
