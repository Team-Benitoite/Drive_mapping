import { prefectures } from './prefectures';

export interface AddressLookupResult {
  address: string;
  prefectureCode: string;
}

export function matchPrefectureCodeFromAddress(addressText: string): string {
  const normalized = String(addressText || '').trim();
  if (!normalized) return '';

  for (const prefecture of prefectures) {
    if (normalized.includes(prefecture.name)) {
      return String(prefecture.code);
    }
  }
  return '';
}

function buildJapaneseAddressFromNominatim(data: {
  display_name?: string;
  address?: Record<string, string | undefined>;
}): string {
  const parts = data.address;
  if (parts) {
    const state = parts.province || parts.state || '';
    const city =
      parts.city ||
      parts.town ||
      parts.village ||
      parts.municipality ||
      parts.county ||
      '';
    const wardOrDistrict = parts.city_district || parts.suburb || parts.quarter || '';
    const neighborhood = parts.neighbourhood || parts.hamlet || '';
    const road = parts.road || '';
    const houseNumber = parts.house_number || '';

    const segments: string[] = [];
    for (const seg of [state, city, wardOrDistrict, neighborhood, road]) {
      if (seg && !segments.includes(seg)) {
        segments.push(seg);
      }
    }
    const joined = `${segments.join('')}${houseNumber ? houseNumber : ''}`.trim();
    if (joined) return joined;
  }

  const display = String(data.display_name || '').trim();
  if (!display) return '';

  // Nominatimのdisplay_nameは詳細から国名の順で並ぶため、日本表記を整える
  const cleaned = display
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== '日本' && !/^\d{3}-?\d{4}$/.test(part))
    .reverse()
    .join('');
  return cleaned || display;
}

export async function reverseGeocodeToJapaneseAddress(
  lat: number,
  lng: number,
): Promise<AddressLookupResult> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('accept-language', 'ja');
  url.searchParams.set('zoom', '16');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('住所の逆ジオコーディングに失敗しました。');
  }

  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };

  const address = buildJapaneseAddressFromNominatim(data);
  if (!address) {
    throw new Error('この位置から住所を特定できませんでした。');
  }

  return {
    address,
    prefectureCode: matchPrefectureCodeFromAddress(address),
  };
}

export async function lookupAddressByPostalCode(
  rawPostalCode: string,
): Promise<AddressLookupResult> {
  const digits = rawPostalCode.replace(/[^0-9]/g, '');
  if (digits.length !== 7) {
    throw new Error('郵便番号は7桁の数字で入力してください（例: 100-0001）。');
  }

  const url = `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('郵便番号検索サービスへの接続に失敗しました。');
  }

  const data = (await response.json()) as {
    status: number;
    message: string | null;
    results:
      | {
          address1: string;
          address2: string;
          address3: string;
          prefcode: string;
        }[]
      | null;
  };

  if (data.status !== 200 || !data.results || data.results.length === 0) {
    throw new Error(
      data.message || '該当する郵便番号の住所が見つかりませんでした。',
    );
  }

  const first = data.results[0];
  const address = `${first.address1 || ''}${first.address2 || ''}${first.address3 || ''}`.trim();
  const prefectureCode =
    matchPrefectureCodeFromAddress(first.address1) ||
    (first.prefcode ? String(Number(first.prefcode)) : '');

  return {
    address,
    prefectureCode,
  };
}
