import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Auth ─────────────────────────────────────────────
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ── Profile ──────────────────────────────────────────
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function upsertProfile(userId, profile) {
  const payload = {
    id: userId,
    name: profile.name ?? '',
    neighborhood: profile.neighborhood ?? '',
    allergy: profile.allergy ?? '',
    dietary: profile.dietary ?? '',
    food_mood: profile.food_mood ?? [],
  };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Daily input ──────────────────────────────────────
export async function fetchDailyInput(userId, date) {
  const { data, error } = await supabase
    .from('daily_inputs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertDailyInput(userId, input) {
  const { data, error } = await supabase
    .from('daily_inputs')
    .upsert({ user_id: userId, ...input }, { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Missions ─────────────────────────────────────────
export async function fetchMissions(userId) {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return data || [];
}

export async function insertMission(userId, mission) {
  const { data, error } = await supabase
    .from('missions')
    .insert({ user_id: userId, ...mission })
    .select()
    .single();
  if (error) throw error;
  return data;
}
