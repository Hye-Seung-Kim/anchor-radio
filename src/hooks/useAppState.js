import { useState, useEffect, useCallback } from 'react';
import { DEFAULTS } from '../data/defaults';
import { fetchWeather, isWeatherStale } from '../services/weatherApi';
import {
  supabase, signIn, signUp, signOut, getSession,
  fetchProfile, upsertProfile,
  fetchDailyInput, upsertDailyInput,
  fetchMissions, insertMission,
} from '../services/supabase';
import {
  LS,
  setActivityPrefs,
  getActivityPrefs,
  getActivityPlaces,
  getMissionSuggestions,
  saveMissionPhoto,
  setMissions,
} from '../services/storage';

function toMissionsState(rows = []) {
  return {
    history:         rows,
    anchors:         [...new Set(rows.filter(r => r.place).map(r => r.place)
                       .filter((p, _, arr) => arr.filter(x => x === p).length >= 2))],
    streak:          rows.length,
    total_completed: rows.length,
  };
}

export function useAppState() {
  const [screen,   setScreen]   = useState('auth');
  const [userId,   setUserId]   = useState(null);
  const [profile,  setProfileS] = useState(DEFAULTS.user_profile);
  const [daily,    setDailyS]   = useState(DEFAULTS.daily_input);
  const [weather,  setWeatherS] = useState(DEFAULTS.weather);
  const [missions, setMissionsS]= useState(DEFAULTS.missions);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const navigate = useCallback((id) => setScreen(id), []);

  // ── Boot: check existing session ─────────────────
  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            await loadUserData(session.user.id);
          } else {
            setUserId(null);
            setScreen('auth');
          }
        }
      );
      return () => subscription.unsubscribe();
    })();
  }, []);

  // ── Load all user data from Supabase ─────────────
  async function loadUserData(uid) {
    setUserId(uid);
    try {
      const [prof, missionRows] = await Promise.all([
        fetchProfile(uid),
        fetchMissions(uid),
      ]);

      if (!prof?.neighborhood) {
        navigate('s1');
        return;
      }

      const p = {
        name:         prof.name         || '',
        neighborhood: prof.neighborhood || '',
        allergy:      prof.allergy      || '',
        dietary:      prof.dietary      || '',
        food_mood:    prof.food_mood    || [],
        started_at:   prof.created_at   || prof.started_at || null,
      };
      setProfileS(p);
      LS.set('user_profile', p);

      const today = new Date().toISOString().slice(0, 10);
      const di = await fetchDailyInput(uid, today);
      if (di) setDailyS(di);

      setMissionsS(toMissionsState(missionRows));

      const cachedW = LS.get('weather');
      if (cachedW && !isWeatherStale(cachedW) && cachedW.lat != null) {
        setWeatherS(cachedW);
      } else {
        // Use stored coords if available, otherwise city name
        const target = (cachedW?.lat != null)
          ? { lat: cachedW.lat, lon: cachedW.lon }
          : p.neighborhood || null;
        if (target) {
          const w = await fetchWeather(target); // now includes lat/lon from API
          LS.set('weather', w);
          setWeatherS(w);
        }
      }

      // If this user already has today's stops cached, resume them after sign-in.
      const todaysPlaces = getActivityPlaces(uid);
      const todaysStops = getMissionSuggestions(uid);
      const hasPrefetchedStops = todaysPlaces?.date === today && todaysPlaces.places?.length > 0;
      const hasTodaysStops = todaysStops?.date === today && todaysStops.missions?.length > 0;

      if (!getActivityPrefs(uid) && !hasPrefetchedStops && !hasTodaysStops) {
        navigate('prefs');
      } else {
        navigate('s2');
      }
    } catch (e) {
      console.error('loadUserData error:', e);
      setError('Failed to load your data. Please try again.');
      navigate('s1');
    }
  }

  // ── Sign in ───────────────────────────────────────
  const handleSignIn = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await signIn(email, password);
      await loadUserData(user.id);
    } catch (e) {
      setError(e.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sign up ───────────────────────────────────────
  const handleSignUp = useCallback(async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      const { user, session } = await signUp(email, password);
      if (!user) throw new Error('Sign up failed. Please try again.');

      // Supabase email confirmation is ON → session is null until confirmed
      if (!session) {
        setError('✉️ Check your email and click the confirmation link, then sign in.');
        return;
      }

      setUserId(user.id);
      setProfileS(p => ({ ...p, name: name || '' }));
      navigate('s1');
    } catch (e) {
      setError(e.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Sign out ──────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      await signOut();
      setUserId(null);
      setProfileS(DEFAULTS.user_profile);
      setDailyS(DEFAULTS.daily_input);
      setWeatherS(DEFAULTS.weather);
      setMissionsS(DEFAULTS.missions);
      LS.set('user_profile', null);
      LS.set('weather', null);
      navigate('auth');
      return true;
    } catch (e) {
      console.error('Sign out failed:', e);
      setError(e.message || 'Sign out failed.');
      return false;
    }
  }, [navigate]);

  // ── Finish onboarding (name + neighborhood only) ──
  const finishOnboarding = useCallback(async (form) => {
    setLoading(true);
    setError(null);
    try {
      const prof = {
        name:         form.name         || profile.name || 'neighbor',
        neighborhood: form.neighborhood,
        allergy:      '',
        dietary:      '',
        food_mood:    [],
      };

      const uid = userId || (await getSession())?.user?.id;
      if (!uid) throw new Error('Not authenticated');

      const savedProfile = await upsertProfile(uid, prof);
      const nextProfile = {
        ...prof,
        started_at: profile.started_at || savedProfile?.created_at || new Date().toISOString(),
      };
      setProfileS(nextProfile);
      LS.set('user_profile', nextProfile);

      // fetchWeather now always returns lat/lon from the API response
      const weatherTarget = (form.lat != null) ? { lat: form.lat, lon: form.lon } : form.neighborhood;
      const w = await fetchWeather(weatherTarget);
      LS.set('weather', w);
      setWeatherS(w);

      // After onboarding, go to prefs (not s2 directly)
      navigate('prefs');
    } catch (e) {
      setError(e.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, profile.name, navigate]);

  // ── Save activity prefs (session-level) ──────────
  const savePrefs = useCallback((prefs) => {
    setActivityPrefs(prefs, userId);
    navigate('s2');
  }, [navigate, userId]);

  // ── Complete mission → save to Supabase ──────────
  const completeMission = useCallback(async ({ place, note, type, photo }) => {
    const uid = userId || (await getSession())?.user?.id;
    if (!uid) return null;
    const date = new Date().toISOString().slice(0, 10);
    const previousVisits = (missions.history || []).filter(h => h.place === (place || '')).length;
    const visitCount = previousVisits + 1;
    const entry = {
      id:      `local-${date}-${place || 'mission'}`,
      date,
      type:    type || 'visit',
      place:   place || '',
      note:    note  || '',
      weather: weather.description || '',
      mood:    daily.mood          || '',
      created_at: new Date().toISOString(),
    };
    const dbEntry = {
      date:    entry.date,
      type:    entry.type,
      place:   entry.place,
      note:    entry.note,
      weather: entry.weather,
      mood:    entry.mood,
    };
    const optimisticState = toMissionsState([entry, ...(missions.history || [])]);

    if (photo && place) saveMissionPhoto(date, place, photo);
    setMissionsS(optimisticState);
    setMissions(optimisticState);

    void (async () => {
      try {
        await insertMission(uid, dbEntry);
        const rows = await fetchMissions(uid);
        const syncedState = toMissionsState(rows);
        setMissionsS(syncedState);
        setMissions(syncedState);
      } catch (e) {
        console.error('Mission save failed:', e);
        setError(e.message || 'Mission save failed.');
      }
    })();

    return {
      success: true,
      visitCount,
      isFirstVisit: visitCount === 1,
    };
  }, [userId, weather, daily, missions.history, setError]);

  return {
    screen, navigate,
    userId,
    profile, daily, weather, missions,
    loading, error, setError,
    handleSignIn, handleSignUp, handleSignOut,
    finishOnboarding,
    savePrefs,
    completeMission,
  };
}
