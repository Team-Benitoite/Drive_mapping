import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { navigate } from '../utils/navigation';

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      if (supabase) await supabase.auth.signOut();
      navigate('/');
    }

    logout();
  }, []);

  return (
    <section className="panel">
      <p>ログアウトしています...</p>
    </section>
  );
}
