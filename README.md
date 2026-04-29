# Anchor Radio

A mobile-first AI voice radio app that gives you a personalized morning broadcast — local weather, neighborhood missions, and a conversational AI host powered by ElevenLabs.

**Live:** https://anchor-radio-app.netlify.app

---

## What it does

Anchor Radio acts as your neighborhood companion. Every day it:

- Greets you with a personalized voice broadcast based on your name, location, and the weather
- Suggests **3 real nearby places** (cafés, parks, restaurants, etc.) matched to your preferences — pulled live from Google Places
- Lets you complete missions by checking in, adding a photo and note
- Saves everything to a **Memory timeline** so you can look back at where you've been

---

## Features

| Feature | Details |
|---|---|
| 🎙️ AI Voice Radio | ElevenLabs conversational agent with real-time voice |
| 📍 Live Place Suggestions | Google Places API — 1 real place per preference, within 1.5km |
| 🗺️ Map Integration | Google Maps opens to the exact business via `place_id` |
| ✅ Mission Check-in | Photo upload, note, saved to Supabase |
| 🧠 Memory Timeline | History of completed missions with photos |
| 🌤️ Live Weather | OpenWeatherMap — temperature, conditions, icon |
| 🔐 Auth | Supabase email/password auth |
| 📱 Mobile-first | Designed as a 390×780 phone UI |

---

## Tech Stack

- **Frontend** — React 18 + Vite
- **AI Voice** — ElevenLabs React SDK (`@elevenlabs/react`)
- **Places** — Google Places API (New) `searchNearby`
- **Maps** — Google Maps URL with `query_place_id`
- **Weather** — OpenWeatherMap API
- **Database & Auth** — Supabase (PostgreSQL + Row Level Security)
- **Deployment** — Netlify

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Hye-Seung-Kim/anchor-radio.git
cd anchor-radio
npm install
```

### 2. Environment variables

Create a `.env.local` file in the root:

```env
VITE_GOOGLE_PLACES_KEY=your_google_places_api_key
VITE_OPENWEATHER_KEY=your_openweathermap_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
VITE_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase setup

Create these tables in your Supabase project:

```sql
-- Profiles
create table profiles (
  id uuid references auth.users primary key,
  name text,
  neighborhood text,
  allergy text,
  dietary text,
  food_mood text[]
);

-- Missions
create table missions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date text,
  type text,
  place text,
  note text,
  weather text,
  mood text,
  created_at timestamptz default now()
);

-- Daily inputs
create table daily_inputs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date text,
  mood text,
  unique(user_id, date)
);
```

Enable RLS and add policies:

```sql
create policy "Users can manage own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage own missions" on missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own daily_inputs" on daily_inputs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Also turn off **email confirmation** in:
`Authentication → Providers → Email → Confirm email: OFF`

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`

---

## Project Structure

```
src/
├── components/
│   ├── AuthScreen.jsx          # Login / sign up
│   ├── OnboardingScreen.jsx    # Name + neighborhood setup
│   ├── PrefsScreen.jsx         # Activity preference picker (fetches real places)
│   ├── RadioScreen.jsx         # Main screen — AI radio + mission cards
│   ├── MemoryScreen.jsx        # Mission history timeline
│   ├── MissionCompleteModal.jsx# Check-in modal with photo upload
│   └── MenuDrawer.jsx          # Side menu
├── hooks/
│   ├── useAppState.js          # Global state + Supabase sync
│   └── useRadio.js             # ElevenLabs session management
├── services/
│   ├── placesApi.js            # Google Places + Overpass fallback
│   ├── weatherApi.js           # OpenWeatherMap
│   ├── supabase.js             # Supabase client + queries
│   └── storage.js              # localStorage helpers
└── data/
    └── defaults.js             # Default state values + activity options
```

---

## User Flow

```
Sign up → Onboarding (name + location) → Pick preferences
→ "Finding your spots…" (Google Places fetch)
→ Radio screen with 3 real nearby missions
→ Tap MAP → opens exact place in Google Maps
→ Tap "I'm here ✓" → add photo + note → saved to Memory
```

---

## Deployment

Deployed on Netlify with environment variables set via the Netlify dashboard. The `netlify.toml` handles the build command and SPA redirect rules.

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
