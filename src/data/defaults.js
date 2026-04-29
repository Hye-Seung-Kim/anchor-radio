// ── User profile (set once at onboarding) ────────────
export const DEFAULTS = {
  user_profile: {
    name:         '',
    neighborhood: '',
    allergy:      '',        // e.g. "nuts, shellfish"
    dietary:      '',        // e.g. "vegetarian", "no pork"
    food_mood:    [],        // e.g. ["warm", "light", "spicy"]
  },

  // Daily input — reset each day
  daily_input: {
    date:          null,
    craving:       '',       // free text: "something warm and soupy"
    cook_or_eat:   null,     // 'cook' | 'eat_out' | null (AI decides if null)
    energy:        3,        // 1-5
    mood:          '',       // free text: "tired", "excited", etc.
  },

  // Auto-fetched each session
  weather: {
    description:  '',        // "cool and cloudy"
    temp:         null,      // celsius
    icon:         '',        // weather emoji
    fetched_at:   null,
  },

  // Mission memory - accumulates over time
  missions: {
    history: [],             // [{ date, type, place, note, photo, mood, weather }]
    anchors: [],             // places visited 2+ times
    streak:  0,
    total_completed: 0,
  },

  app_state: {
    onboarding_done: false,
    current_screen:  's1',
    last_active:     null,
  },
};

export const FOOD_MOOD_OPTIONS = [
  'Warm & comforting', 'Light & fresh', 'Spicy', 'Sweet',
  'Something new',     'Quick & easy',  'Hearty', 'Healthy',
];

export const ACTIVITY_OPTIONS = [
  'Coffee',
  'Parks',
  'Restaurants',
  'Groceries',
  'Museums & Galleries',
  'Bookstores',
  'Movie Theaters',
];

export const ENERGY_LABELS = {
  1: 'Very low',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'High energy',
};
