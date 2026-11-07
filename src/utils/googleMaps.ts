import type { RouteLocationPoint, RouteLocationSource } from '../types/models';

const DIRECTIONS_URL = 'https://www.google.com/maps/dir/';
const EMBED_DIRECTIONS_URL =
  'https://www.google.com/maps/embed/v1/directions';

interface DirectionsParts {
  origin: string;
  destination: string;
  waypoints: string[];
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
