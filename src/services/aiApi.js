const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
};

async function callClaude(prompt, maxTokens = 200) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || '';
}

// ── Daily mission generation ─────────────────────────
export async function fetchMissionFromAI(profile, places) {
  const comfort = ['solo & independent', 'warm observer', 'open to connection'][
    (profile.social_comfort || 1) - 1
  ];
  const daysSinceMoved = profile.move_date
    ? Math.floor((Date.now() - new Date(profile.move_date)) / 86400000) + 1
    : 'a few';

  const prompt = `You are a gentle daily companion for someone who just moved to ${profile.neighborhood || 'a new city'}.
They moved ${daysSinceMoved} days ago.
Food preferences: ${(profile.food_pref || []).join(', ') || 'varied'}.
Social comfort level: ${comfort}.
Available nearby places: ${places.map((p) => p.name).join(', ')}.
Morning routine: ${profile.routine_morning || '9–11am'}.

Generate ONE small, achievable daily mission for today.
Warm, low-pressure, tied to one specific place from the list.
Respond ONLY with valid JSON — no markdown, no extra text:
{"title": "short mission title (max 8 words)", "sub": "1-2 sentence description, warm and specific (max 30 words)", "place_name": "exact place name from the list"}`;

  try {
    const raw    = await callClaude(prompt, 200);
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const matched = places.find((p) =>
      p.name.toLowerCase().includes((parsed.place_name || '').toLowerCase()) ||
      (parsed.place_name || '').toLowerCase().includes(p.name.toLowerCase())
    ) || places[0];

    return {
      id:           'mission-' + Date.now(),
      date:         new Date().toISOString().slice(0, 10),
      title:        parsed.title || 'Explore today',
      sub:          parsed.sub   || 'Take a small step into your neighborhood.',
      place_id:     matched.id,
      status:       'pending',
      completed_at: null,
    };
  } catch {
    return null; // caller falls back to local generation
  }
}

// ── Daily briefing radio text ─────────────────────────
export async function fetchBriefingFromAI({ profile, places, missions }) {
  const visitedNames = places.filter((p) => p.visited).map((p) => p.name);
  const notes        = places.filter((p) => p.note).map((p) => `"${p.note}" — at ${p.name}`);

  const prompt = `You are the Morning Anchor — a warm, poetic daily briefing voice for someone rebuilding their daily life in ${profile.neighborhood || 'a new neighborhood'}.

Visited places so far: ${visitedNames.join(', ') || 'none yet'}.
Notes they've left: ${notes.join('; ') || 'none yet'}.
Current streak: ${missions.streak || 0} days.
Today's mission: ${missions.today?.title || 'explore somewhere new'}.

Write ONE short ambient sentence (20-30 words).
Warm, like a radio whisper. Reference their real places and notes when possible.
No greetings, no "I", no emojis. Plain text only.`;

  try {
    return await callClaude(prompt, 80);
  } catch {
    return null;
  }
}
