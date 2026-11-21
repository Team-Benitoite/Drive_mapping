import type { RouteLocationPoint, RouteLocationSource } from '../types/models';

const DIRECTIONS_URL = 'https://www.google.com/maps/dir/';
const EMBED_DIRECTIONS_URL =
  'https://www.google.com/maps/embed/v1/directions';

interface DirectionsParts {
  origin: string;
  destination: string;
  waypoints: string[];
}

export interface ParsedGoogleMapsRoute {
  isValidGoogleMapsUrl: boolean;
  isShortenedUrl: boolean;
  hasParsedRoute: boolean;
  start: string;
  goal: string;
  waypoints: string[];
  destinationAddressCandidate: string;
  destinationCoords: { lat: number; lng: number } | null;
}

function pointLocation(point: RouteLocationPoint): string {
  return String(point?.address || point?.label || '').trim();
}

export function getRouteLocations(
  route: RouteLocationSource | null | undefined,
): string[] {
  const locations = [...(route?.route_points || [])]
    .sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0))
    .map(pointLocation)
    .filter(Boolean);

  const routeAddress = String(route?.address || '').trim();
  if (
    locations.length === 1 &&
    routeAddress &&
    locations[0] !== routeAddress
  ) {
    locations.push(routeAddress);
  }

  return locations;
}

function getDirectionsParts(
  route: RouteLocationSource | null | undefined,
): DirectionsParts | null {
  const locations = getRouteLocations(route);
  if (locations.length < 2) return null;

  return {
    origin: locations[0],
    destination: locations[locations.length - 1],
    waypoints: locations.slice(1, -1),
  };
}

export function buildGoogleMapsDirectionsUrl(
  route: RouteLocationSource | null | undefined,
): string {
  const directions = getDirectionsParts(route);
  if (!directions) return '';

  const params = new URLSearchParams({
    api: '1',
    origin: directions.origin,
    destination: directions.destination,
    travelmode: 'driving',
  });

  if (directions.waypoints.length) {
    params.set('waypoints', directions.waypoints.join('|'));
  }

  return `${DIRECTIONS_URL}?${params.toString()}`;
}

export function buildGoogleMapsEmbedUrl(
  route: RouteLocationSource | null | undefined,
  apiKey: string | null | undefined,
): string {
  const directions = getDirectionsParts(route);
  const key = String(apiKey || '').trim();
  if (!directions || !key) return '';

  const params = new URLSearchParams({
    key,
    origin: directions.origin,
    destination: directions.destination,
    mode: 'driving',
  });

  if (directions.waypoints.length) {
    params.set('waypoints', directions.waypoints.join('|'));
  }

  return `${EMBED_DIRECTIONS_URL}?${params.toString()}`;
}

export function isGoogleMapsUrl(value: string | null | undefined): boolean {
  const input = String(value || '').trim();
  if (!input) return true;

  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return false;

    const hostname = url.hostname.toLowerCase();
    if (hostname === 'maps.app.goo.gl') return true;
    if (hostname === 'goo.gl') return url.pathname.startsWith('/maps');

    const googleDomain =
      /(^|\.)google\.[a-z]{2,}(?:\.[a-z]{2,})?$/.test(hostname);
    if (!googleDomain) return false;

    return hostname.startsWith('maps.google.') || url.pathname.startsWith('/maps');
  } catch {
    return false;
  }
}

export function getSafeGoogleMapsUrl(value: string | null | undefined): string {
  const input = String(value || '').trim();
  return input && isGoogleMapsUrl(input) ? input : '';
}

export function buildGoogleMapsSearchUrl(query: string | null | undefined): string {
  const trimmed = String(query || '').trim();
  if (!trimmed) return '';
  const params = new URLSearchParams({
    api: '1',
    query: trimmed,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function getRouteGoogleMapsUrl(
  route: RouteLocationSource & {
    google_maps_url?: string | null;
    title?: string | null;
    prefecture_name?: string | null;
  },
): string {
  const shared = getSafeGoogleMapsUrl(route.google_maps_url);
  if (shared) return shared;
  const directions = buildGoogleMapsDirectionsUrl(route);
  if (directions) return directions;
  const fallbackQuery =
    String(route.address || '').trim() ||
    [route.prefecture_name, route.title].filter(Boolean).join(' ').trim();
  return buildGoogleMapsSearchUrl(fallbackQuery);
}

function decodeLocationSegment(raw: string): string {
  const normalized = raw.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(normalized).trim();
  } catch {
    return normalized.trim();
  }
}

export function parseCoordinateText(
  value: string | null | undefined,
): { lat: number; lng: number } | null {
  const trimmed = String(value || '').trim();
  const match = trimmed.match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  return { lat, lng };
}

function extractCoordinatesFromPathAt(pathname: string): { lat: number; lng: number } | null {
  const atMatch = pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!atMatch) return null;
  return parseCoordinateText(`${atMatch[1]},${atMatch[2]}`);
}

export function parseGoogleMapsRouteUrl(
  rawUrl: string | null | undefined,
): ParsedGoogleMapsRoute {
  const emptyResult: ParsedGoogleMapsRoute = {
    isValidGoogleMapsUrl: false,
    isShortenedUrl: false,
    hasParsedRoute: false,
    start: '',
    goal: '',
    waypoints: [],
    destinationAddressCandidate: '',
    destinationCoords: null,
  };

  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || !isGoogleMapsUrl(trimmed)) {
    return emptyResult;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    const isShortened =
      hostname === 'maps.app.goo.gl' ||
      (hostname === 'goo.gl' && url.pathname.startsWith('/maps'));

    if (isShortened) {
      return {
        ...emptyResult,
        isValidGoogleMapsUrl: true,
        isShortenedUrl: true,
      };
    }

    let start = '';
    let goal = '';
    let waypoints: string[] = [];

    // 1. Maps URLs API (?origin=...&destination=...&waypoints=...)
    const originParam = url.searchParams.get('origin');
    const destinationParam = url.searchParams.get('destination');
    const waypointsParam = url.searchParams.get('waypoints');
    if (originParam || destinationParam) {
      start = originParam ? decodeLocationSegment(originParam) : '';
      goal = destinationParam ? decodeLocationSegment(destinationParam) : '';
      if (waypointsParam) {
        waypoints = waypointsParam
          .split('|')
          .map((item) => decodeLocationSegment(item))
          .filter(Boolean);
      }
    }

    // 2. Classic directions params (?saddr=...&daddr=...)
    if (!start && !goal) {
      const saddr = url.searchParams.get('saddr');
      const daddr = url.searchParams.get('daddr');
      if (saddr || daddr) {
        start = saddr ? decodeLocationSegment(saddr) : '';
        if (daddr) {
          const parts = decodeLocationSegment(daddr)
            .split(/\s+to:/i)
            .map((part) => part.trim())
            .filter(Boolean);
          if (parts.length > 0) {
            goal = parts[parts.length - 1];
            waypoints = parts.slice(0, -1);
          }
        }
      }
    }

    // 3. Path-based /maps/dir/origin/.../destination/@...
    if (!start && !goal && url.pathname.includes('/maps/dir/')) {
      const dirTail = url.pathname.split('/maps/dir/')[1] || '';
      const rawSegments = dirTail.split('/');
      const cleanedSegments: string[] = [];

      for (const segment of rawSegments) {
        if (!segment) {
          if (cleanedSegments.length === 0) {
            cleanedSegments.push('');
          }
          continue;
        }
        if (
          segment.startsWith('@') ||
          segment.startsWith('data=') ||
          segment.startsWith('am=') ||
          segment.startsWith('entry=')
        ) {
          break;
        }
        cleanedSegments.push(decodeLocationSegment(segment));
      }

      if (cleanedSegments.length >= 2) {
        start = cleanedSegments[0];
        goal = cleanedSegments[cleanedSegments.length - 1];
        waypoints = cleanedSegments.slice(1, -1).filter(Boolean);
      } else if (cleanedSegments.length === 1 && cleanedSegments[0]) {
        goal = cleanedSegments[0];
      }
    }

    // 4. Place / Search URLs (/maps/place/..., /maps/search/?query=..., ?q=...)
    if (!goal && url.pathname.includes('/maps/place/')) {
      const placeTail = url.pathname.split('/maps/place/')[1] || '';
      const placeSegment = placeTail
        .split('/')
        .find(
          (segment) =>
            segment &&
            !segment.startsWith('@') &&
            !segment.startsWith('data='),
        );
      if (placeSegment) {
        goal = decodeLocationSegment(placeSegment);
      }
    }

    if (!goal) {
      const queryParam =
        url.searchParams.get('query') || url.searchParams.get('q');
      if (queryParam) {
        goal = decodeLocationSegment(queryParam);
      }
    }

    const goalCoords =
      parseCoordinateText(goal) || extractCoordinatesFromPathAt(url.pathname);
    const destinationAddressCandidate =
      goal && !parseCoordinateText(goal) ? goal : '';

    return {
      isValidGoogleMapsUrl: true,
      isShortenedUrl: false,
      hasParsedRoute: Boolean(start || goal),
      start,
      goal,
      waypoints,
      destinationAddressCandidate,
      destinationCoords: goalCoords,
    };
  } catch {
    return emptyResult;
  }
}
