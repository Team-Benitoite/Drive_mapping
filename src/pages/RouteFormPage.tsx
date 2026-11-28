import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import AuthGuard from '../components/AuthGuard';
import HelpTip from '../components/HelpTip';
import PrefectureSelect from '../components/PrefectureSelect';
import { useAuth } from '../contexts/AuthContext';
import { storageBucket, supabase } from '../lib/supabase';
import {
  isGoogleMapsUrl,
  parseGoogleMapsRouteUrl,
  type ParsedGoogleMapsRoute,
} from '../utils/googleMaps';
import {
  lookupAddressByPostalCode,
  matchPrefectureCodeFromAddress,
  reverseGeocodeToJapaneseAddress,
} from '../utils/addressLookup';
import { getPrefectureName, prefectures } from '../utils/prefectures';
import { getPublicPhotoUrl, isOwner, normalizeMiddlePoints } from '../utils/routeData';
import { navigate } from '../utils/navigation';
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
  middlePoints: [{ label: '', address: '' }],
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

interface PointAddressAutofillProps {
  pointLabel: string;
  onApplyAddress: (address: string, prefectureCode: string) => void;
}

function PointAddressAutofill({
  pointLabel,
  onApplyAddress,
}: PointAddressAutofillProps) {
  const [postalCode, setPostalCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState<'geo' | 'postal' | null>(null);
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookupError, setLookupError] = useState('');

  function handleCurrentLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLookupError('お使いのブラウザは現在地取得に対応していません。');
      return;
    }

    setLookupLoading('geo');
    setLookupError('');
    setLookupMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocodeToJapaneseAddress(
            position.coords.latitude,
            position.coords.longitude,
          );
          onApplyAddress(result.address, result.prefectureCode);
          setLookupMessage('現在地から住所を自動入力しました。');
        } catch (lookupErr) {
          setLookupError(
            getErrorMessage(lookupErr, '現在地から住所を取得できませんでした。'),
          );
        } finally {
          setLookupLoading(null);
        }
      },
      (geoError) => {
        setLookupLoading(null);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLookupError(
            '位置情報の利用が許可されていません。ブラウザの設定をご確認ください。',
          );
        } else {
          setLookupError('現在地の取得に失敗しました。');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function handlePostalCodeLookup() {
    setLookupLoading('postal');
    setLookupError('');
    setLookupMessage('');
    try {
      const result = await lookupAddressByPostalCode(postalCode);
      onApplyAddress(result.address, result.prefectureCode);
      setLookupMessage('郵便番号から住所を自動入力しました。');
    } catch (lookupErr) {
      setLookupError(
        getErrorMessage(lookupErr, '郵便番号からの住所取得に失敗しました。'),
      );
    } finally {
      setLookupLoading(null);
    }
  }

  return (
    <div className="point-autofill-section">
      <div className="address-autofill-bar">
        <button
          type="button"
          className="address-autofill-btn"
          onClick={handleCurrentLocation}
          disabled={lookupLoading !== null}
        >
          {lookupLoading === 'geo' ? '現在地を取得中...' : '📍 現在地を取得'}
        </button>

        <div className="postal-lookup-row">
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (postalCode.trim() && lookupLoading === null) {
                  void handlePostalCodeLookup();
                }
              }
            }}
            placeholder="郵便番号 (例: 100-0001)"
            aria-label={`${pointLabel}の郵便番号`}
          />
          <button
            type="button"
            className="address-autofill-btn"
            onClick={() => void handlePostalCodeLookup()}
            disabled={lookupLoading !== null || !postalCode.trim()}
          >
            {lookupLoading === 'postal'
              ? '検索中...'
              : '📮 郵便番号から住所を取得'}
          </button>
        </div>
      </div>

      {lookupMessage && (
        <p className="success address-status-msg">{lookupMessage}</p>
      )}
      {lookupError && (
        <p className="error address-status-msg">{lookupError}</p>
      )}
    </div>
  );
}

export default function RouteFormPage({ mode, id }: RouteFormPageProps) {
  const isEditMode = mode === 'edit';
  const { user } = useAuth();
  const [form, setForm] = useState<RouteFormValues>(emptyForm);
  const [middlePointKeys, setMiddlePointKeys] = useState<string[]>([
    'middle-point-init-0',
  ]);
  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<RouteDetailPhoto[]>([]);
  const [deletePhotoIds, setDeletePhotoIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notOwner, setNotOwner] = useState(false);

  const middleKeySeqRef = useRef(0);
  const middlePointKeysRef = useRef<string[]>(['middle-point-init-0']);

  const lastAutoFillRef = useRef({
    address: '',
    startLabel: '',
    goalLabel: '',
  });

  const pageTitle = isEditMode ? '投稿編集' : '投稿作成';

  const parsedGoogleMaps: ParsedGoogleMapsRoute = useMemo(
    () => parseGoogleMapsRouteUrl(form.googleMapsUrl),
    [form.googleMapsUrl],
  );

  const remainingPhotoCount = useMemo(
    () => existingPhotos.length - deletePhotoIds.length + files.length,
    [deletePhotoIds.length, existingPhotos.length, files.length],
  );

  const visibleExistingPhotos = useMemo(
    () => existingPhotos.filter((photo) => !deletePhotoIds.includes(photo.id)),
    [existingPhotos, deletePhotoIds],
  );

  const filePreviews = useMemo(
    () =>
      files.map((file, index) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [filePreviews]);

  function handleRemoveNewFile(targetIndex: number) {
    setFiles((current) => current.filter((_, index) => index !== targetIndex));
  }

  function updateField<Field extends keyof RouteFormValues>(
    field: Field,
    value: RouteFormValues[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const hasMainPrefecture = Boolean(form.prefectureCode);

  function handleMainPrefectureChange(nextCode: string) {
    setForm((current) => ({
      ...current,
      prefectureCode: nextCode,
      subPrefectureCodes: nextCode
        ? current.subPrefectureCodes.filter((code) => code !== nextCode)
        : [],
    }));
  }

  function toggleSubPrefecture(code: string) {
    if (!form.prefectureCode || code === form.prefectureCode) return;
    setForm((current) => {
      const exists = current.subPrefectureCodes.includes(code);
      return {
        ...current,
        subPrefectureCodes: exists
          ? current.subPrefectureCodes.filter((item) => item !== code)
          : [...current.subPrefectureCodes, code],
      };
    });
  }

  function createMiddlePointKey(): string {
    middleKeySeqRef.current += 1;
    return `middle-point-${middleKeySeqRef.current}`;
  }

  function syncMiddlePointKeys(nextKeys: string[]) {
    middlePointKeysRef.current = nextKeys;
    setMiddlePointKeys(nextKeys);
  }

  function handleGoogleMapsUrlChange(nextUrl: string) {
    const parsed = parseGoogleMapsRouteUrl(nextUrl);
    let generatedKeys: string[] | null = null;

    setForm((current) => {
      const next = { ...current, googleMapsUrl: nextUrl };

      if (parsed.hasParsedRoute) {
        if (
          parsed.start &&
          (!current.startLabel.trim() ||
            current.startLabel === lastAutoFillRef.current.startLabel)
        ) {
          next.startLabel = parsed.start;
          lastAutoFillRef.current.startLabel = parsed.start;
        }
        if (
          parsed.goal &&
          (!current.goalLabel.trim() ||
            current.goalLabel === lastAutoFillRef.current.goalLabel)
        ) {
          next.goalLabel = parsed.goal;
          lastAutoFillRef.current.goalLabel = parsed.goal;
        }
        if (
          parsed.waypoints.length > 0 &&
          normalizeMiddlePoints(current.middlePoints).length === 0
        ) {
          next.middlePoints = parsed.waypoints.map((wp) => ({
            label: wp,
            address: '',
          }));
          generatedKeys = parsed.waypoints.map(() => createMiddlePointKey());
        }
        if (
          parsed.destinationAddressCandidate &&
          (!current.address.trim() ||
            current.address === lastAutoFillRef.current.address)
        ) {
          next.address = parsed.destinationAddressCandidate;
          lastAutoFillRef.current.address = parsed.destinationAddressCandidate;
          if (!current.prefectureCode) {
            const matchedPref = matchPrefectureCodeFromAddress(
              parsed.destinationAddressCandidate,
            );
            if (matchedPref) {
              next.prefectureCode = matchedPref;
              next.subPrefectureCodes = current.subPrefectureCodes.filter(
                (c) => c !== matchedPref,
              );
            }
          }
        }
      }

      return next;
    });

    if (generatedKeys) {
      syncMiddlePointKeys(generatedKeys);
    }
  }

  function applyFixedPointAddress(
    field: 'startAddress' | 'goalAddress',
    address: string,
    prefectureCode: string,
  ) {
    setForm((current) => {
      const next: RouteFormValues = { ...current, [field]: address };
      if (!current.prefectureCode && prefectureCode) {
        next.prefectureCode = prefectureCode;
        next.subPrefectureCodes = current.subPrefectureCodes.filter(
          (code) => code !== prefectureCode,
        );
      }
      return next;
    });
  }

  function applyMiddlePointAddressByKey(
    pointKey: string,
    address: string,
    prefectureCode: string,
  ) {
    setForm((current) => {
      const targetIndex = middlePointKeysRef.current.indexOf(pointKey);
      if (targetIndex < 0 || targetIndex >= current.middlePoints.length) {
        return current;
      }

      const next: RouteFormValues = {
        ...current,
        middlePoints: current.middlePoints.map((point, idx) =>
          idx === targetIndex ? { ...point, address } : point,
        ),
      };

      if (!current.prefectureCode && prefectureCode) {
        next.prefectureCode = prefectureCode;
        next.subPrefectureCodes = current.subPrefectureCodes.filter(
          (code) => code !== prefectureCode,
        );
      }

      return next;
    });
  }

  function addMiddlePoint() {
    const nextKey = createMiddlePointKey();
    syncMiddlePointKeys([...middlePointKeysRef.current, nextKey]);
    setForm((current) => ({
      ...current,
      middlePoints: [...current.middlePoints, { label: '', address: '' }],
    }));
  }

  function updateMiddlePoint(
    index: number,
    field: keyof MiddlePointInput,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      middlePoints: current.middlePoints.map((point, currentIndex) =>
        currentIndex === index ? { ...point, [field]: value } : point,
      ),
    }));
  }

  function removeMiddlePoint(index: number) {
    syncMiddlePointKeys(
      middlePointKeysRef.current.filter(
        (_key, currentIndex) => currentIndex !== index,
      ),
    );
    setForm((current) => ({
      ...current,
      middlePoints: current.middlePoints.filter(
        (_point, currentIndex) => currentIndex !== index,
      ),
    }));
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

      const mainPrefStr = String(data.prefecture_code || '');

      const initialMiddlePoints =
        middlePoints.length > 0 ? middlePoints : [{ label: '', address: '' }];

      setForm({
        title: data.title || '',
        summary: data.summary || '',
        description: data.description || '',
        address: data.address || '',
        siteUrl: data.site_url || '',
        googleMapsUrl: data.google_maps_url || '',
        prefectureCode: mainPrefStr,
        subPrefectureCodes:
          data.route_prefectures
            ?.filter(
              (prefecture) =>
                !prefecture.is_main &&
                String(prefecture.prefecture_code) !== mainPrefStr,
            )
            .map((prefecture) => String(prefecture.prefecture_code)) || [],
        startLabel: startPoint?.label || '',
        startAddress: startPoint?.address || '',
        middlePoints: initialMiddlePoints,
        goalLabel: goalPoint?.label || '',
        goalAddress: goalPoint?.address || '',
      });
      syncMiddlePointKeys(
        initialMiddlePoints.map(() => createMiddlePointKey()),
      );

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

    const uniqueSubCodes = Array.from(
      new Set(
        form.subPrefectureCodes.filter(
          (code) => code && code !== form.prefectureCode,
        ),
      ),
    );

    const rows: TablesInsert<'route_prefectures'>[] = [
      {
        route_id: routeId,
        prefecture_code: Number(form.prefectureCode),
        is_main: true,
      },
      ...uniqueSubCodes.map((code) => ({
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
        address: form.address.trim() || form.goalAddress.trim() || null,
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

  if (loading) {
    return (
      <div className="route-form-page">
        <section className="panel">投稿を読み込んでいます...</section>
      </div>
    );
  }
  if (notOwner) {
    return (
      <div className="route-form-page">
        <section className="panel">
          <h1>権限がありません</h1>
          <p>この投稿を編集できるのは投稿者本人だけです。</p>
        </section>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="route-form-page">
        <section className="form-panel wide">
          <div className="heading-with-help page-title-with-help">
            <h1>{pageTitle}</h1>
            <HelpTip
              title={pageTitle}
              description={
                isEditMode
                  ? '投稿済みのドライブコースの内容・都道府県・ルート地点・写真を更新する画面です。'
                  : 'おすすめのドライブコースやツーリングルートを新しく投稿して共有する画面です。'
              }
              usage="タイトルとメイン都道府県を入力し、必要に応じてルート地点やGoogleマップURL、写真（最大10枚）を設定して「投稿する／更新する」を押してください。"
            />
          </div>
          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSubmit}>
          <div className="form-field">
            <div className="form-field-label-row">
              <label htmlFor="route-title">タイトル（必須）</label>
              <HelpTip
                title="タイトル（必須）"
                description="投稿一覧や日本地図の人気カードに表示されるドライブコースの名前です（100文字以内）。"
                usage="「湘南海岸サンセットロード」のように、走る場所や魅力が伝わるタイトルを入力してください。"
              />
            </div>
            <input
              id="route-title"
              type="text"
              maxLength={100}
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <div className="form-field-label-row">
              <label htmlFor="route-summary">概要（任意）</label>
              <HelpTip
                title="概要（任意）"
                description="一覧カードに短く表示されるキャッチコピー・一言まとめです（255文字以内）。"
                usage="「海沿いを走る約40kmの爽快コース」など、コースの特徴を1〜2行で入力できます。"
              />
            </div>
            <input
              id="route-summary"
              type="text"
              maxLength={255}
              value={form.summary}
              onChange={(event) => updateField('summary', event.target.value)}
            />
          </div>

          <div className="form-field">
            <div className="form-field-label-row">
              <label htmlFor="route-description">説明（任意）</label>
              <HelpTip
                title="説明（任意）"
                description="投稿詳細ページに表示されるコースの見どころやアドバイスを自由に書ける欄です。"
                usage="おすすめの時間帯、駐車場・道の駅の情報、景観のポイントなどを詳しく書くと他のドライバーの参考になります。"
              />
            </div>
            <textarea
              id="route-description"
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
            />
          </div>

          <div className="form-field">
            <div className="form-field-label-row">
              <label htmlFor="route-main-prefecture">メイン都道府県（必須）</label>
              <HelpTip
                title="メイン都道府県（必須）"
                description="このドライブコースの中心となる都道府県を1つ指定します。"
                usage="プルダウンから選択してください。選択した都道府県の日本地図カウントに反映され、下の「サブ都道府県」も選択できるようになります。"
              />
            </div>
            <PrefectureSelect
              id="route-main-prefecture"
              value={form.prefectureCode}
              onChange={handleMainPrefectureChange}
              required
            />
            <small>ドライブコースの中心となる都道府県を1つ選択してください。</small>
          </div>

          <div
            className={`sub-pref-picker ${!hasMainPrefecture ? 'is-disabled' : ''}`}
            aria-disabled={!hasMainPrefecture}
          >
            <div className="sub-pref-header">
              <span className="sub-pref-label heading-with-help">
                <span>サブ都道府県（任意・複数選択可）</span>
                <HelpTip
                  title="サブ都道府県（任意・複数選択可）"
                  description="県境をまたぐルートで、メイン以外に経由・関連する都道府県を追加登録できる項目です。"
                  usage="先にメイン都道府県を選ぶとロックが解除されます。経由する都道府県にチェックを入れると、それらの県の検索や地図カウントにも表示されます。"
                />
              </span>
              <div className="sub-pref-actions">
                <span className="sub-pref-count">
                  選択中: {form.subPrefectureCodes.length}件
                </span>
                {hasMainPrefecture && form.subPrefectureCodes.length > 0 && (
                  <button
                    type="button"
                    className="sub-pref-clear-btn"
                    onClick={() => updateField('subPrefectureCodes', [])}
                  >
                    選択をクリア
                  </button>
                )}
              </div>
            </div>
            <p className="sub-pref-help">
              県境をまたぐルートの場合、メイン以外に経由・関連する都道府県を複数選択できます（選択した都道府県の一覧検索にも表示されます）。
            </p>
            {!hasMainPrefecture && (
              <p className="sub-pref-locked-notice" role="status">
                ※先にメイン都道府県を選択してください
              </p>
            )}
            <fieldset
              className="sub-pref-fieldset"
              disabled={!hasMainPrefecture}
            >
              <div
                className={`sub-pref-grid ${!hasMainPrefecture ? 'is-disabled' : ''}`}
                role="group"
                aria-label="サブ都道府県（複数選択）"
              >
                {prefectures.map((prefecture) => {
                  const codeStr = String(prefecture.code);
                  const isMain = form.prefectureCode === codeStr;
                  const isSelected = form.subPrefectureCodes.includes(codeStr);
                  const isOptionDisabled = !hasMainPrefecture || isMain;
                  return (
                    <label
                      key={prefecture.code}
                      className={`sub-pref-option ${isSelected ? 'is-selected' : ''} ${
                        isMain ? 'is-main' : ''
                      } ${!hasMainPrefecture ? 'is-locked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isOptionDisabled}
                        onChange={() => toggleSubPrefecture(codeStr)}
                      />
                      <span>{prefecture.name}</span>
                      {isMain && <em className="sub-pref-main-tag">メイン</em>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {hasMainPrefecture && form.subPrefectureCodes.length > 0 && (
              <p className="sub-pref-selected-names">
                選択済み：
                {form.subPrefectureCodes
                  .map((code) => getPrefectureName(code))
                  .join('・')}
              </p>
            )}
          </div>

          <div className="form-field">
            <div className="form-field-label-row">
              <label htmlFor="route-site-url">目的地のサイト（任意）</label>
              <HelpTip
                title="目的地のサイト（任意）"
                description="立ち寄り先や観光スポット・道の駅などの公式WebサイトURLを登録できる欄です。"
                usage="https:// から始まるURLを入力すると、投稿詳細画面からリンクで開けるようになります。"
              />
            </div>
            <input
              id="route-site-url"
              type="url"
              value={form.siteUrl}
              onChange={(event) => updateField('siteUrl', event.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <hr />

          <div className="heading-with-help section-heading-with-help">
            <h2>ルート設定</h2>
            <HelpTip
              title="ルート設定"
              description="ドライブの出発地・経由スポット・目的地、およびGoogleマップの経路URLを登録するエリアです。"
              usage="各地点の名称や住所を手入力するか、「📍 現在地を取得」「📮 郵便番号から住所を取得」、または下のGoogleマップURL欄からルート情報を自動反映できます。"
            />
          </div>
          <div className="route-mode-panel">
            <div className="point-box">
              <div className="heading-with-help point-heading-with-help">
                <h3>🚩 スタート地点</h3>
                <HelpTip
                  title="スタート地点"
                  description="ドライブコースの出発地点名と住所を設定する欄です。"
                  usage="地点名と住所を入力するか、「📍 現在地を取得」／郵便番号検索で住所を自動入力できます。"
                />
              </div>
              <input
                type="text"
                value={form.startLabel}
                onChange={(event) => updateField('startLabel', event.target.value)}
                placeholder="地点名（例: 東京駅丸の内口）"
              />
              <input
                type="text"
                value={form.startAddress}
                onChange={(event) =>
                  updateField('startAddress', event.target.value)
                }
                placeholder="住所（任意）"
              />
              <PointAddressAutofill
                pointLabel="スタート地点"
                onApplyAddress={(address, prefCode) =>
                  applyFixedPointAddress('startAddress', address, prefCode)
                }
              />
            </div>

            <div className="manual-middle-section">
              <div className="heading-with-help point-heading-with-help">
                <h3>📍 中間地点（経由スポット）</h3>
                <HelpTip
                  title="中間地点（経由スポット）"
                  description="途中で立ち寄りたい道の駅・展望台・景勝地などの経由地を登録する欄です。"
                  usage="「＋ 中間地点を追加」で経由スポットをいくつでも追加できます。現在地や郵便番号からの住所取得にも対応しています。"
                />
              </div>
              {form.middlePoints.map((point, index) => {
                const pointKey = middlePointKeys[index] || `middle-fallback-${index}`;
                return (
                  <div className="point-box" key={pointKey}>
                    <input
                      type="text"
                      value={point.label}
                      onChange={(event) =>
                        updateMiddlePoint(index, 'label', event.target.value)
                      }
                      placeholder="中間地点名（例: 道の駅・展望台）"
                    />
                    <input
                      type="text"
                      value={point.address}
                      onChange={(event) =>
                        updateMiddlePoint(index, 'address', event.target.value)
                      }
                      placeholder="住所（任意）"
                    />
                    <PointAddressAutofill
                      pointLabel={`中間地点${index + 1}`}
                      onApplyAddress={(address, prefCode) =>
                        applyMiddlePointAddressByKey(pointKey, address, prefCode)
                      }
                    />
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => removeMiddlePoint(index)}
                    >
                      削除
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className="add-middle-btn"
                onClick={addMiddlePoint}
              >
                ＋ 中間地点を追加
              </button>
            </div>

            <div className="point-box">
              <div className="heading-with-help point-heading-with-help">
                <h3>🏁 ゴール地点</h3>
                <HelpTip
                  title="ゴール地点"
                  description="ドライブコースの終点（目的地）の名称と住所を設定する欄です。"
                  usage="地点名と住所を入力するか、「📍 現在地を取得」／郵便番号検索で住所を自動入力できます。"
                />
              </div>
              <input
                type="text"
                value={form.goalLabel}
                onChange={(event) => updateField('goalLabel', event.target.value)}
                placeholder="地点名（例: 江の島展望灯台）"
              />
              <input
                type="text"
                value={form.goalAddress}
                onChange={(event) =>
                  updateField('goalAddress', event.target.value)
                }
                placeholder="住所（任意）"
              />
              <PointAddressAutofill
                pointLabel="ゴール地点"
                onApplyAddress={(address, prefCode) =>
                  applyFixedPointAddress('goalAddress', address, prefCode)
                }
              />
            </div>

            <div className="gmaps-url-section">
              <div className="form-field">
                <div className="form-field-label-row">
                  <label htmlFor="route-gmaps-url">🗺️ GoogleマップのルートURL（任意）</label>
                  <HelpTip
                    title="GoogleマップのルートURL（任意）"
                    description="Googleマップで作成したルートを共有し、詳細画面にリンク・埋め込み表示するためのURL欄です。"
                    usage="Googleマップで経路検索したブラウザのURL（https://www.google.com/maps/dir/...）を貼り付けると、スタート・経由地・ゴールが上の欄へ自動反映されます。"
                  />
                </div>
                <input
                  id="route-gmaps-url"
                  type="url"
                  maxLength={2048}
                  value={form.googleMapsUrl}
                  onChange={(event) =>
                    handleGoogleMapsUrlChange(event.target.value)
                  }
                  placeholder="https://www.google.com/maps/dir/スタート地点/ゴール地点/..."
                />
                <small>
                  Googleマップでルートを検索し、ブラウザのURLまたは共有URLを貼り付けてください。標準の経路URLからはスタート・ゴールを自動で抽出して上欄に反映します。
                </small>
              </div>

              {form.googleMapsUrl.trim() && (
                <div className="gmaps-parse-preview">
                  {!parsedGoogleMaps.isValidGoogleMapsUrl ? (
                    <p className="gmaps-parse-warning">
                      有効なGoogleマップのHTTPS URLを入力してください（google.co.jp/maps または maps.app.goo.gl）。
                    </p>
                  ) : parsedGoogleMaps.isShortenedUrl ? (
                    <div className="gmaps-parse-notice">
                      <p>
                        短縮URL（maps.app.goo.gl）はブラウザ上でリンク先の地点名を直接読み取れないため、必要に応じて上欄にスタート・ゴールを手入力するか、ブラウザのアドレスバーの長いURL（https://www.google.com/maps/dir/...）を貼り付けてください。
                      </p>
                    </div>
                  ) : parsedGoogleMaps.hasParsedRoute ? (
                    <div className="gmaps-parse-result">
                      <div className="gmaps-parse-title">
                        URLからルート情報を抽出しました
                      </div>
                      <div className="gmaps-parse-points">
                        <div className="gmaps-parse-point">
                          <span className="gmaps-parse-badge is-start">
                            🚩 スタート
                          </span>
                          <span>
                            {form.startLabel || parsedGoogleMaps.start || '未指定'}
                          </span>
                        </div>
                        {parsedGoogleMaps.waypoints.length > 0 && (
                          <div className="gmaps-parse-point">
                            <span className="gmaps-parse-badge is-middle">
                              📍 経由地
                            </span>
                            <span>{parsedGoogleMaps.waypoints.join(' → ')}</span>
                          </div>
                        )}
                        <div className="gmaps-parse-point">
                          <span className="gmaps-parse-badge is-goal">
                            🏁 ゴール
                          </span>
                          <span>
                            {form.goalLabel || parsedGoogleMaps.goal || '未指定'}
                          </span>
                        </div>
                      </div>
                      <p className="gmaps-parse-hint">
                        ※抽出した地点名は上の各入力欄に反映されています（そのまま編集できます）。
                      </p>
                    </div>
                  ) : (
                    <p className="gmaps-parse-warning">
                      URLからスタート/ゴールを自動判別できませんでした。上欄のスタート・中間・ゴール地点から直接入力できます。
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <hr />

          <div className="heading-with-help section-heading-with-help">
            <h2>写真</h2>
            <HelpTip
              title="写真（最大10枚）"
              description="ドライブ中に撮影した風景や愛車の写真（JPG・PNG・WebP形式）を最大10枚までアップロードできます。1枚目の写真が投稿一覧や日本地図カードのサムネイル（代表写真）になります。"
              usage="複数枚をまとめて選ぶことも、追加で選び足すことも可能です（合計10枚まで）。削除したい写真はプレビュー右上の「×」ボタンで取り消せます。"
            />
          </div>
          <p className="photo-section-note">
            ※1枚目の写真が投稿一覧や地図カードのサムネイルになります（JPG・PNG・WebP形式／最大10枚まで）。
          </p>
          {(visibleExistingPhotos.length > 0 || filePreviews.length > 0) && (
            <div className="existing-photos">
              {visibleExistingPhotos.map((photo) => (
                <div key={photo.id} className="photo-delete-card">
                  <button
                    type="button"
                    className="photo-delete-button"
                    onClick={() =>
                      setDeletePhotoIds([...deletePhotoIds, photo.id])
                    }
                    aria-label="登録済み写真を削除"
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

              {filePreviews.map((preview, index) => (
                <div key={preview.key} className="photo-delete-card is-new">
                  <button
                    type="button"
                    className="photo-delete-button"
                    onClick={() => handleRemoveNewFile(index)}
                    aria-label={`${preview.name} を削除`}
                  >
                    ×
                  </button>
                  <img src={preview.url} alt={preview.name} />
                </div>
              ))}
            </div>
          )}

          <div className="form-field">
            <div className="form-field-label-row">
              <label htmlFor="route-photos">写真を追加（最大10枚）</label>
            </div>
            <input
              id="route-photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => {
                const picked = Array.from(event.target.files || []);
                if (picked.length > 0) {
                  setFiles((current) => [...current, ...picked]);
                }
                event.target.value = '';
              }}
            />
            <small>現在の保存予定: {remainingPhotoCount} / 10枚</small>
          </div>

          <div className="form-submit-row">
            <button type="submit" disabled={submitting}>
              {submitting ? '保存中...' : isEditMode ? '更新する' : '投稿する'}
            </button>
          </div>
          </form>
        </section>
      </div>
    </AuthGuard>
  );
}
