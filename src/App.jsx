import { useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout.jsx';
import EnvNotice from './components/EnvNotice.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LogoutPage from './pages/LogoutPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RouteFormPage from './pages/RouteFormPage.jsx';
import RouteShowPage from './pages/RouteShowPage.jsx';
import RoutesIndexPage from './pages/RoutesIndexPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

function parseRoute(pathname) {
  if (pathname === '/') return { name: 'home' };
  if (pathname === '/signup') return { name: 'signup' };
  if (pathname === '/login') return { name: 'login' };
  if (pathname === '/logout') return { name: 'logout' };
  if (pathname === '/profile') return { name: 'profile' };
  if (pathname === '/favorites') return { name: 'favorites' };
  if (pathname === '/routes') return { name: 'routes_index' };
  if (pathname === '/routes/new') return { name: 'routes_create' };

  const editMatch = pathname.match(/^\/routes\/(\d+)\/edit$/);
  if (editMatch) return { name: 'routes_edit', id: Number(editMatch[1]) };

  const showMatch = pathname.match(/^\/routes\/(\d+)$/);
  if (showMatch) return { name: 'routes_show', id: Number(showMatch[1]) };

  const profileMatch = pathname.match(/^\/profiles\/([0-9a-f-]+)$/i);
  if (profileMatch) return { name: 'profile_show', id: profileMatch[1] };

  return { name: 'not_found' };
}

export default function App() {
  const [locationKey, setLocationKey] = useState(window.location.href);
  const { hasSupabaseEnv } = useAuth();

  useEffect(() => {
    function handlePopState() {
      setLocationKey(window.location.href);
      window.scrollTo({ top: 0 });
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const route = useMemo(
    () => parseRoute(new URL(locationKey).pathname),
    [locationKey],
  );

  return (
    <Layout>
      {!hasSupabaseEnv && <EnvNotice />}
      {route.name === 'home' && <HomePage />}
      {route.name === 'signup' && <SignupPage />}
      {route.name === 'login' && <LoginPage />}
      {route.name === 'logout' && <LogoutPage />}
      {route.name === 'profile' && <ProfilePage />}
      {route.name === 'profile_show' && <ProfilePage id={route.id} />}
      {route.name === 'favorites' && <FavoritesPage />}
      {route.name === 'routes_index' && <RoutesIndexPage />}
      {route.name === 'routes_create' && <RouteFormPage mode="create" />}
      {route.name === 'routes_show' && <RouteShowPage id={route.id} />}
      {route.name === 'routes_edit' && (
        <RouteFormPage mode="edit" id={route.id} />
      )}
      {route.name === 'not_found' && (
        <section className="panel">
          <h1>ページが見つかりません</h1>
          <p>URLを確認してください。</p>
        </section>
      )}
    </Layout>
  );
}
