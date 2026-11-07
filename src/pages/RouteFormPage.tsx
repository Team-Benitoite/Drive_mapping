import { useEffect, useMemo, useState, type FormEvent } from 'react';
import AuthGuard from '../components/AuthGuard';
import PrefectureSelect from '../components/PrefectureSelect';
import { useAuth } from '../contexts/AuthContext';
import { storageBucket, supabase } from '../lib/supabase';
import { isGoogleMapsUrl } from '../utils/googleMaps';
import { prefectures } from '../utils/prefectures';
import { getPublicPhotoUrl, isOwner, normalizeMiddlePoints } from '../utils/routeData';
import { Link, navigate } from '../utils/navigation';
import { getErrorMessage } from '../utils/errors';
import type { TablesInsert } from '../types/database';
import type {
  MiddlePointInput,
  RouteDetailPhoto,
} from '../types/models';

export interface RouteFormValues {
  title: string;
  summary: string;
  description: string;
  address: string;
  siteUrl: string;
  googleMapsUrl: string;
  prefectureCode: string;
  subPrefectureCodes: string[];
  startLabel: string;
  startAddress: string;
  middlePoints: MiddlePointInput[];
  goalLabel: string;
  goalAddress: string;
}

const emptyForm: RouteFormValues = {
  title: '',
  summary: '',
  description: '',
  address: '',
  siteUrl: '',
  googleMapsUrl: '',
  prefectureCode: '',
  subPrefectureCodes: [],
  startLabel: '',
  startAddress: '',
  middlePoints: [],
  goalLabel: '',
  goalAddress: '',
};

function safeStorageName(file: File): string {
  const extension = file.name.includes('.')
    ? file.name.split('.').pop()?.toLowerCase() || 'jpg'
    : 'jpg';
  const token =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${token}.${extension}`;
}

function buildPointRows(
  routeId: number,
  form: RouteFormValues,
): TablesInsert<'route_points'>[] {
  const rows: TablesInsert<'route_points'>[] = [];

  if (form.startLabel.trim() || form.startAddress.trim()) {
    rows.push({
      route_id: routeId,
      point_type: 'start',
      label: form.startLabel.trim() || 'スタート',
      address: form.startAddress.trim() || null,
      sort_order: 0,
    });
  }

  normalizeMiddlePoints(form.middlePoints).forEach((point, index) => {
    rows.push({
      route_id: routeId,
      point_type: 'middle',
      label: point.label.trim() || '中間地点',
      address: point.address.trim() || null,
      sort_order: index + 1,
    });
  });

  if (form.goalLabel.trim() || form.goalAddress.trim()) {
    rows.push({
      route_id: routeId,
      point_type: 'goal',
      label: form.goalLabel.trim() || 'ゴール',
      address: form.goalAddress.trim() || null,
      sort_order: 999,
    });
  }

  return rows;
}

export interface RouteFormPageProps {
  mode: 'create' | 'edit';
  id?: number;
}

export default function RouteFormPage({ mode, id }: RouteFormPageProps) {
  const isEditMode = mode === 'edit';
  const { user } = useAuth();
  const [form, setForm] = useState<RouteFormValues>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<RouteDetailPhoto[]>([]);
  const [deletePhotoIds, setDeletePhotoIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notOwner, setNotOwner] = useState(false);

  const pageTitle = isEditMode ? '投稿編集' : '投稿作成';

  const remainingPhotoCount = useMemo(
    () => existingPhotos.length - deletePhotoIds.length + files.length,
    [deletePhotoIds.length, existingPhotos.length, files.length],
  );

  function updateField<Field extends keyof RouteFormValues>(
    field: Field,
    value: RouteFormValues[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addMiddlePoint() {
    updateField('middlePoints', [
      ...form.middlePoints,
      { label: '', address: '' },
    ]);
  }

  function updateMiddlePoint(
    index: number,
    field: keyof MiddlePointInput,
    value: string,
  ) {
    updateField(
      'middlePoints',
      form.middlePoints.map((point, currentIndex) =>
        currentIndex === index ? { ...point, [field]: value } : point,
      ),
    );
  }

  function removeMiddlePoint(index: number) {
    updateField(
      'middlePoints',
      form.middlePoints.filter((_point, currentIndex) => currentIndex !== index),
    );
  }

  useEffect(() => {
    async function loadRoute() {
      if (!isEditMode || id === undefined || !supabase || !user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('routes')
        .select(
          `
            *,
            route_prefectures(prefecture_code, is_main),
            route_points(point_type, label, address, sort_order),
            route_photos(id, storage_path, thumb_path, sort_order)
          `,
        )
        .eq('id', id)
        .order('sort_order', {
          foreignTable: 'route_points',
          ascending: true,
        })
        .order('sort_order', {
          foreignTable: 'route_photos',
          ascending: true,
        })
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('投稿が見つかりません。');
        setLoading(false);
        return;
      }

      if (!isOwner(data, user)) {
        setNotOwner(true);
        setLoading(false);
        return;
      }

      const startPoint = data.route_points?.find(
        (point) => point.point_type === 'start',
      );
      const goalPoint = data.route_points?.find(
        (point) => point.point_type === 'goal',
      );
      const middlePoints =
        data.route_points
          ?.filter((point) => point.point_type === 'middle')
          .map((point) => ({
            label: point.label || '',
            address: point.address || '',
          })) || [];

      setForm({
        title: data.title || '',
        summary: data.summary || '',
        description: data.description || '',
        address: data.address || '',
        siteUrl: data.site_url || '',
        googleMapsUrl: data.google_maps_url || '',
        prefectureCode: String(data.prefecture_code || ''),
        subPrefectureCodes:
          data.route_prefectures
            ?.filter((prefecture) => !prefecture.is_main)
            .map((prefecture) => String(prefecture.prefecture_code)) || [],
        startLabel: startPoint?.label || '',
        startAddress: startPoint?.address || '',
        middlePoints,
        goalLabel: goalPoint?.label || '',
        goalAddress: goalPoint?.address || '',
      });
      setExistingPhotos(data.route_photos || []);
      setLoading(false);
    }

    loadRoute();
  }, [id, isEditMode, user]);

  function validate(): string {
    if (!form.title.trim() || form.title.length > 100) {
      return 'タイトルは必須（100文字以内）です。';
    }
    if (form.summary.length > 255) {
      return '概要は255文字以内にしてください。';
    }
    if (!form.prefectureCode) {
      return 'メインで通った都道府県を選択してください。';
    }
    if (form.address.length > 255) {
      return '住所は255文字以内にしてください。';
    }
    if (form.siteUrl && !/^https?:\/\/.+/.test(form.siteUrl)) {
      return '目的地のサイトはURL形式で入力してください。';
    }
    if (form.googleMapsUrl.length > 2048) {
      return 'Google Maps共有URLは2048文字以内にしてください。';
    }
    if (!isGoogleMapsUrl(form.googleMapsUrl)) {
      return 'Google Maps共有URLには、Google Mapsの共有画面でコピーしたHTTPS URLを入力してください。';
    }
    if (remainingPhotoCount > 10) {
      return '写真は最大10枚までです。';
    }
    return '';
  }

  async function savePrefectures(
    client: NonNullable<typeof supabase>,
    routeId: number,
  ) {
    if (isEditMode) {
      await client.from('route_prefectures').delete().eq('route_id', routeId);
    }

    const rows: TablesInsert<'route_prefectures'>[] = [
      {
        route_id: routeId,
        prefecture_code: Number(form.prefectureCode),
        is_main: true,
      },
      ...form.subPrefectureCodes
        .filter((code) => code && code !== form.prefectureCode)
        .map((code) => ({
          route_id: routeId,
          prefecture_code: Number(code),
          is_main: false,
        })),
    ];

    if (rows.length) {
      const { error: insertError } = await client
        .from('route_prefectures')
        .insert(rows);
      if (insertError) throw insertError;
    }
  }

  async function savePoints(
    client: NonNullable<typeof supabase>,
    routeId: number,
  ) {
    if (isEditMode) {
      await client.from('route_points').delete().eq('route_id', routeId);
    }

    const rows = buildPointRows(routeId, form);
    if (rows.length) {
      const { error: insertError } = await client
        .from('route_points')
        .insert(rows);
      if (insertError) throw insertError;
    }
  }

  async function deleteSelectedPhotos(
    client: NonNullable<typeof supabase>,
    routeId: number,
  ) {
    if (!deletePhotoIds.length) return;

    const targets = existingPhotos.filter((photo) =>
      deletePhotoIds.includes(photo.id),
    );
    const paths = targets
      .flatMap((photo) => [photo.storage_path, photo.thumb_path])
      .filter((path): path is string => Boolean(path));

    if (paths.length) {
      await client.storage.from(storageBucket).remove(paths);
    }

    const { error: deleteError } = await client
      .from('route_photos')
      .delete()
      .eq('route_id', routeId)
      .in('id', deletePhotoIds);

    if (deleteError) throw deleteError;
  }

  async function uploadPhotos(
    client: NonNullable<typeof supabase>,
    userId: string,
    routeId: number,
  ) {
    if (!files.length) return;

    const rows: TablesInsert<'route_photos'>[] = [];
    for (const [index, file] of files.entries()) {
      const storagePath = `${userId}/${routeId}/${safeStorageName(file)}`;
      const { error: uploadError } = await client.storage
        .from(storageBucket)
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      rows.push({
        route_id: routeId,
        storage_path: storagePath,
        thumb_path: null,
        sort_order: existingPhotos.length + index,
      });
    }

    const { error: insertError } = await client
      .from('route_photos')
      .insert(rows);
    if (insertError) throw insertError;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!supabase || !user) {
      setError('Supabase環境変数が未設定です。');
      return;
    }

    const client = supabase;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      let routeId = id;
      const routePayload: TablesInsert<'routes'> = {
        user_id: user.id,
        title: form.title.trim(),
        summary: form.summary.trim() || null,
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        site_url: form.siteUrl.trim() || null,
        google_maps_url: form.googleMapsUrl.trim() || null,
        prefecture_code: Number(form.prefectureCode),
      };

      if (isEditMode) {
        if (routeId === undefined) throw new Error('投稿IDが不明です。');
        const { error: updateError } = await client
          .from('routes')
          .update(routePayload)
          .eq('id', routeId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await client
          .from('routes')
          .insert(routePayload)
          .select('id')
          .single();
        if (insertError) throw insertError;
        routeId = data.id;
      }

      await savePrefectures(client, routeId);
      await savePoints(client, routeId);
      await deleteSelectedPhotos(client, routeId);
      await uploadPhotos(client, user.id, routeId);

      navigate(`/routes/${routeId}`);
    } catch (submitError) {
      setError(getErrorMessage(submitError, '保存に失敗しました。'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <section className="panel">投稿を読み込んでいます...</section>;
  if (notOwner) {
    return (
      <section className="panel">
        <h1>権限がありません</h1>
        <p>この投稿を編集できるのは投稿者本人だけです。</p>
      </section>
    );
  }

  return (
    <AuthGuard>
      <section className="form-panel wide">
        <div className="topnav">
          <Link href="/">← トップ（日本地図）へ戻る</Link>
          <Link href="/routes">投稿一覧</Link>
        </div>
        <h1>{pageTitle}</h1>
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            タイトル（必須）
            <input
              type="text"
              maxLength={100}
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
            />
          </label>

          <label>
            概要（任意）
            <input
              type="text"
              maxLength={255}
              value={form.summary}
              onChange={(event) => updateField('summary', event.target.value)}
            />
          </label>

          <label>
            メインで通った都道府県（必須）
            <PrefectureSelect
              value={form.prefectureCode}
              onChange={(value) => updateField('prefectureCode', value)}
              required
            />
          </label>

          <label>
            サブで通った都道府県（任意・複数）
            <select
              multiple
              size={6}
              value={form.subPrefectureCodes}
              onChange={(event) =>
                updateField(
                  'subPrefectureCodes',
                  Array.from(event.target.selectedOptions).map(
                    (option) => option.value,
                  ),
                )
              }
            >
              {prefectures.map((prefecture) => (
                <option key={prefecture.code} value={prefecture.code}>
                  {prefecture.name}
                </option>
              ))}
            </select>
            <small>CtrlまたはCommandキーで複数選択できます。</small>
          </label>

          <label>
            説明（任意）
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
            />
          </label>

          <label>
            住所（任意）
            <input
              type="text"
              maxLength={255}
              value={form.address}
              onChange={(event) => updateField('address', event.target.value)}
            />
          </label>

          <label>
            目的地のサイト（任意）
            <input
              type="url"
              value={form.siteUrl}
              onChange={(event) => updateField('siteUrl', event.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label>
            Google Maps共有URL（任意）
            <input
              type="url"
              maxLength={2048}
              value={form.googleMapsUrl}
              onChange={(event) =>
                updateField('googleMapsUrl', event.target.value)
              }
              placeholder="https://maps.app.goo.gl/..."
            />
            <small>
              Google Mapsで経路を作成し、「共有」からコピーしたURLを入力してください。
            </small>
          </label>

          <hr />

          <h2>ルート</h2>
          <div className="point-box">
            <h3>スタート</h3>
            <input
              type="text"
              value={form.startLabel}
              onChange={(event) => updateField('startLabel', event.target.value)}
              placeholder="地点名"
            />
            <input
              type="text"
              value={form.startAddress}
              onChange={(event) =>
                updateField('startAddress', event.target.value)
              }
              placeholder="住所"
            />
          </div>

          <h3>中間地点</h3>
          {form.middlePoints.map((point, index) => (
            <div className="point-box" key={index}>
              <input
                type="text"
                value={point.label}
                onChange={(event) =>
                  updateMiddlePoint(index, 'label', event.target.value)
                }
                placeholder="中間地点名"
              />
              <input
                type="text"
                value={point.address}
                onChange={(event) =>
                  updateMiddlePoint(index, 'address', event.target.value)
                }
                placeholder="住所"
              />
              <button type="button" onClick={() => removeMiddlePoint(index)}>
                削除
              </button>
            </div>
          ))}
          <button type="button" onClick={addMiddlePoint}>
            中間地点を追加
          </button>

          <div className="point-box">
            <h3>ゴール</h3>
            <input
              type="text"
              value={form.goalLabel}
              onChange={(event) => updateField('goalLabel', event.target.value)}
              placeholder="地点名"
            />
            <input
              type="text"
              value={form.goalAddress}
              onChange={(event) =>
                updateField('goalAddress', event.target.value)
              }
              placeholder="住所"
            />
          </div>

          <hr />

          <h2>写真</h2>
          {existingPhotos.length > 0 && (
            <div className="existing-photos">
              {existingPhotos
                .filter((photo) => !deletePhotoIds.includes(photo.id))
                .map((photo) => (
                  <div key={photo.id} className="photo-delete-card">
                    <button
                      type="button"
                      className="photo-delete-button"
                      onClick={() =>
                        setDeletePhotoIds([...deletePhotoIds, photo.id])
                      }
                      aria-label="写真を削除"
                    >
                      ×
                    </button>
                    <img
                      src={getPublicPhotoUrl(
                        photo.thumb_path || photo.storage_path,
                      )}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                ))}
            </div>
          )}

          <label>
            写真（最大10枚）
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
            <small>現在の保存予定: {remainingPhotoCount} / 10枚</small>
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : isEditMode ? '更新する' : '投稿する'}
          </button>
        </form>
      </section>
    </AuthGuard>
  );
}
