import { DEFAULTS } from '../data/defaults';

export const LS = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

function userScopedKey(baseKey, userId) {
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export function initStorage() {
  Object.entries(DEFAULTS).forEach(([k, v]) => {
    if (!LS.get(k)) LS.set(k, v);
  });
}

// Typed accessors
export const getProfile       = () => LS.get('user_profile')   || DEFAULTS.user_profile;
export const getDailyInput    = () => LS.get('daily_input')    || DEFAULTS.daily_input;
export const getWeather       = () => LS.get('weather')        || DEFAULTS.weather;
export const getMissions      = () => LS.get('missions')       || DEFAULTS.missions;
export const getAppState      = () => LS.get('app_state')      || DEFAULTS.app_state;
export const getActivityPrefs  = (userId = null) => LS.get(userScopedKey('activity_prefs', userId)) || null;
export const getActivityPlaces = (userId = null) => LS.get(userScopedKey('activity_places', userId)) || null;
export const getMissionSuggestions = (userId = null) => LS.get(userScopedKey('mission_suggestions', userId)) || null;

export const setProfile       = (v) => LS.set('user_profile',   v);
export const setDailyInput    = (v) => LS.set('daily_input',    v);
export const setWeather       = (v) => LS.set('weather',        v);
export const setMissions      = (v) => LS.set('missions',       v);
export const setAppState      = (v) => LS.set('app_state',      v);
export const setActivityPrefs  = (v, userId = null) => LS.set(userScopedKey('activity_prefs', userId),  v);
export const setActivityPlaces = (v, userId = null) => LS.set(userScopedKey('activity_places', userId), v);
export const setMissionSuggestions = (v, userId = null) => LS.set(userScopedKey('mission_suggestions', userId), v);

export function saveMissionPhoto(date, place, base64) {
  const cache = LS.get('mission_photos') || {};
  cache[`${date}|${place}`] = base64;
  LS.set('mission_photos', cache);
}

export function getMissionPhoto(date, place) {
  const cache = LS.get('mission_photos') || {};
  return cache[`${date}|${place}`] || null;
}

// Reset daily_input if it's a new day
export function checkDailyReset() {
  const d = getDailyInput();
  const today = new Date().toISOString().slice(0, 10);
  if (d.date !== today) {
    const fresh = { ...DEFAULTS.daily_input, date: today };
    setDailyInput(fresh);
    return fresh;
  }
  return d;
}

// Save completed mission to history
export function completeMission({ place, note, photo, mood, weather, type }) {
  const m = getMissions();
  const entry = {
    date: new Date().toISOString().slice(0, 10),
    type,       // 'eat_out' | 'cook'
    place,
    note,
    photo,      // base64 or null
    mood,
    weather,
  };
  m.history = [entry, ...m.history].slice(0, 60); // keep 60 days
  m.streak = (m.streak || 0) + 1;
  m.total_completed = (m.total_completed || 0) + 1;

  // Anchor logic: 2+ visits = anchor
  const placeCount = m.history.filter(h => h.place === place).length;
  if (placeCount >= 2 && !m.anchors.includes(place)) {
    m.anchors = [...m.anchors, place];
  }
  setMissions(m);
  return m;
}
