const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

export const PREF_EMOJI = {
  'Coffee':              '☕',
  'Parks':               '🌿',
  'Restaurants':         '🍽️',
  'Groceries':           '🛒',
  'Museums & Galleries': '🖼️',
  'Bookstores':          '📚',
  'Movie Theaters':      '🎬',
};

const PREF_TO_PLACE_TYPE = {
  'Coffee':              'cafe',
  'Parks':               'park',
  'Restaurants':         'restaurant',
  'Groceries':           'supermarket',
  'Museums & Galleries': 'museum',
  'Bookstores':          'book_store',
  'Movie Theaters':      'movie_theater',
};

// Overpass OSM tags — fallback when Google Places fails
const PREF_TO_OSM = {
  'Coffee':              { amenity: 'cafe' },
  'Parks':               { leisure: 'park' },
  'Restaurants':         { amenity: 'restaurant' },
  'Groceries':           { shop: 'supermarket' },
  'Museums & Galleries': { tourism: 'museum' },
  'Bookstores':          { shop: 'books' },
  'Movie Theaters':      { amenity: 'cinema' },
};

const FALLBACK_NAMES = {
  'Coffee':              'Your neighborhood café',
  'Parks':               'A local park',
  'Restaurants':         'A nearby restaurant',
  'Groceries':           'Corner store run',
  'Museums & Galleries': 'Local gallery visit',
  'Bookstores':          'A bookshop nearby',
  'Movie Theaters':      'Your local cinema',
};

// ── 1. Browser geolocation ───────────────────────────────
function getBrowserCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      ()           => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// ── 2. Google Places (New) — searchNearby ────────────────
async function fetchViaGooglePlaces(lat, lon, pref, excludeNames = new Set()) {
  const placeType = PREF_TO_PLACE_TYPE[pref];
  if (!placeType || !GOOGLE_KEY) return null;

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'X-Goog-Api-Key':  GOOGLE_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        includedTypes: [placeType],
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: 1500,
          },
        },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.places?.length) return null;

    const fresh = data.places.filter(p => p.displayName?.text && !excludeNames.has(p.displayName.text));
    const pool  = (fresh.length > 0 ? fresh : data.places).slice(0, 10);
    const place = pool[Math.floor(Math.random() * pool.length)];

    return {
      id:      place.id,
      name:    place.displayName?.text || '',
      lat:     place.location?.latitude  ?? null,
      lon:     place.location?.longitude ?? null,
      addr:    place.formattedAddress || '',
      placeId: place.id,
    };
  } catch {
    return null;
  }
}

// ── 3. Overpass (OSM) — fallback ─────────────────────────
async function fetchViaOverpass(lat, lon, pref, radiusM = 2000, excludeNames = new Set()) {
  const osmTag = PREF_TO_OSM[pref];
  if (!osmTag) return null;

  const [k, v] = Object.entries(osmTag)[0];
  const query  = `[out:json][timeout:12];nwr["${k}"="${v}"](around:${radiusM},${lat},${lon});out 15 center;`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 13000);

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.elements?.length) return null;

    const named = data.elements.filter(e => e.tags?.name);
    const fresh = named.filter(e => !excludeNames.has(e.tags.name));
    const pool  = (fresh.length > 0 ? fresh : named).slice(0, 10);
    if (!pool.length) return null;

    const el   = pool[Math.floor(Math.random() * pool.length)];
    const addr = [el.tags['addr:housenumber'], el.tags['addr:street']]
      .filter(Boolean).join(' ') || '';

    return {
      id:      String(el.id),
      name:    el.tags.name,
      lat:     el.lat ?? el.center?.lat ?? null,
      lon:     el.lon ?? el.center?.lon ?? null,
      addr,
      placeId: null,
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ── Fallback builder ─────────────────────────────────────
function buildFallback(pref) {
  return {
    id: pref, name: FALLBACK_NAMES[pref] || 'A local spot',
    pref, emoji: PREF_EMOJI[pref] || '📍',
    addr: '', lat: null, lon: null, placeId: null,
    isFallback: true,
  };
}

// ── Public: fetch one real place per preference ───────────
// Flow: stored coords → browser geolocation
// Per pref: Google Places (New) → Overpass 2km → Overpass 5km → fallback
export async function fetchMissionSuggestions({
  lat, lon, neighborhood,
  preferences  = [],
  excludeNames = new Set(),
}) {
  let coords = (lat != null && lon != null) ? { lat, lon } : null;
  if (!coords) coords = await getBrowserCoords();

  const prefs = preferences.length > 0 ? preferences.slice(0, 3) : ['Coffee', 'Parks', 'Restaurants'];

  if (!coords) return prefs.map(buildFallback);

  const results = await Promise.all(
    prefs.map(async (pref) => {
      let place = await fetchViaGooglePlaces(coords.lat, coords.lon, pref, excludeNames);
      if (!place) place = await fetchViaOverpass(coords.lat, coords.lon, pref, 2000, excludeNames);
      if (!place) place = await fetchViaOverpass(coords.lat, coords.lon, pref, 5000, excludeNames);
      if (!place) return buildFallback(pref);
      return { ...place, pref, emoji: PREF_EMOJI[pref] || '📍' };
    })
  );

  return results;
}

// ── Open specific place in Google Maps ───────────────────
// Uses query_place_id to open the exact business, not a search
export function getMapsDirectionsUrl(m, _neighborhood = '') {
  if (m.placeId) {
    const name = encodeURIComponent(m.name || 'place');
    return `https://www.google.com/maps/search/?api=1&query=${name}&query_place_id=${m.placeId}`;
  }
  if (m.lat && m.lon) {
    return `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}&travelmode=walking`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(m.name || 'place')}`;
}
