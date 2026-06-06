// =============================================================
// バックエンド切り替え
//   .env の VITE_BACKEND で実装を選ぶ（既定: local）。
//     VITE_BACKEND=local     … localStorage（外部不要・即動く）
//     VITE_BACKEND=supabase  … Supabase（要 URL / anon キー）
// =============================================================
import * as local from './local';
import * as supabaseApi from './supabaseApi';

const choice = (import.meta.env.VITE_BACKEND ?? 'local').toLowerCase();

const backend = choice === 'supabase' ? supabaseApi : local;

export const auth = backend.auth;
export const data = backend.data;
export const backendName = backend.backendName;
export const isConfigured = backend.isConfigured;
