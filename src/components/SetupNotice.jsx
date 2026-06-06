// .env が未設定のときに表示する案内画面（ブランク画面の防止）。
export default function SetupNotice() {
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 640, margin: '60px auto' }}>
        <h2>⚙️ セットアップが必要です</h2>
        <p className="muted">
          <code>VITE_BACKEND=supabase</code> ですが Supabase の接続情報が設定されていません。
          ローカルで動かすだけなら <code>.env</code> を <code>VITE_BACKEND=local</code> に
          変更して再起動してください。Supabase を使う場合は以下を設定します。
        </p>
        <ol style={{ lineHeight: 1.9 }}>
          <li>
            <a href="https://supabase.com/" target="_blank" rel="noreferrer">supabase.com</a> で
            プロジェクトを作成する
          </li>
          <li>SQL Editor で <code>supabase/schema.sql</code> を実行する</li>
          <li><strong>Project Settings &gt; API</strong> から URL と anon キーを取得する</li>
          <li>
            プロジェクト直下に <code>.env</code> を作成し、以下を記入する：
            <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
            </pre>
          </li>
          <li>開発サーバーを再起動する（<code>npm run dev</code>）</li>
        </ol>
        <p className="muted">詳細は README.md を参照してください。</p>
      </div>
    </div>
  );
}
