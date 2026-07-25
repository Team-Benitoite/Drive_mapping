const DIRECTIONS_URL = 'https://www.google.com/maps/dir/';
const EMBED_DIRECTIONS_URL =
  'https://www.google.com/maps/embed/v1/directions';

function pointLocation(point) {
  return String(point?.address || point?.label || '').trim();
}

export function getRouteLocations(route) {
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

function getDirectionsParts(route) {
  const locations = getRouteLocations(route);
  if (locations.length < 2) return null;

  return {
    origin: locations[0],
    destination: locations[locations.length - 1],
    waypoints: locations.slice(1, -1),
  };
}

export function buildGoogleMapsDirectionsUrl(route) {
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

export function buildGoogleMapsEmbedUrl(route, apiKey) {
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

export function isGoogleMapsUrl(value) {
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

export function getSafeGoogleMapsUrl(value) {
  const input = String(value || '').trim();
  return input && isGoogleMapsUrl(input) ? input : '';
}
