export default function EnvNotice() {
  return (
    <div className="notice">
      <strong>Supabase未設定:</strong> `.env` に
      `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` の実際の値を設定すると、
      新規登録、ログイン、投稿保存が動作します。サンプル値のままでは接続できません。
    </div>
  );
}
