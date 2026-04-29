const WEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

const WEATHER_ICONS = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️',
};

// Returns { description, temp, icon, fetched_at }
// cityOrCoords: string city name OR { lat, lon } object
export async function fetchWeather(cityOrCoords) {
  try {
    if (!WEATHER_KEY) throw new Error('OpenWeather API key is not configured');

    const qParam = (typeof cityOrCoords === 'object' && cityOrCoords?.lat != null)
      ? `lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}`
      : `q=${encodeURIComponent(cityOrCoords)}`;

    const url = `https://api.openweathermap.org/data/2.5/weather?${qParam}&appid=${WEATHER_KEY}&units=imperial`;
    const res  = await fetch(url);
    const data = await res.json();

    // cod can be number 200 or string "200" depending on the response
    if (Number(data.cod) !== 200) throw new Error(data.message || `API error: cod ${data.cod}`);

    const main     = data.weather[0].main;
    const desc     = data.weather[0].description;   // "light rain"
    const temp     = Math.round(data.main.temp);    // fahrenheit
    const icon     = WEATHER_ICONS[main] || '🌤️';

    // Build human-readable string for AI prompt
    const readable = `${icon} ${temp}°F, ${desc}`;

    return {
      description: readable, temp, icon, fetched_at: Date.now(),
      lat: data.coord?.lat ?? null,
      lon: data.coord?.lon ?? null,
    };
  } catch (e) {
    console.warn('Weather fetch failed:', e);
    // Graceful fallback — AI still works without weather
    return { description: 'weather unavailable', temp: null, icon: '🌤️', fetched_at: Date.now() };
  }
}

// Reverse geocode coordinates → { name, lat, lon } via OpenWeatherMap Geo API
export async function reverseGeocode(lat, lon) {
  try {
    if (!WEATHER_KEY) return null;
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_KEY}`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]?.name) return null;
    return { name: data[0].name, lat, lon };
  } catch {
    return null;
  }
}

// Only refetch if data is older than 30 minutes
export function isWeatherStale(weather) {
  if (!weather?.fetched_at) return true;
  if (weather.description === 'weather unavailable') return true; // ← 이 줄 추가
  return (Date.now() - weather.fetched_at) > 30 * 60 * 1000;
}
