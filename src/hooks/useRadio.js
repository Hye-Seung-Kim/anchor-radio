import { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import {
  getProfile,
  getWeather,
  getDailyInput,
  getMissions,
  getActivityPrefs,
  setWeather,
} from '../services/storage';
import { fetchWeather, isWeatherStale } from '../services/weatherApi';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_4901kqc8r4fgfsavfg0hq47n0xxf';

function getBrowserCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export function useRadio() {
  const [phase,      setPhase]      = useState('idle');
  const [transcript, setTranscript] = useState([]);
  const [error,      setError]      = useState(null);
  const [isPaused,   setIsPaused]   = useState(false);
  const sessionStarted              = useRef(false);

  // Build dynamic variables for agent system prompt
  function buildDynamicVars() {
    const profile  = getProfile();
    const weather  = getWeather();
    const daily    = getDailyInput();
    const missions = getMissions();
    const prefs    = getActivityPrefs() || [];
    const hour     = new Date().getHours();

    return {
      name:           profile.name          || 'neighbor',
      neighborhood:   profile.neighborhood  || '',
      // place_type_1/2/3 map directly to the user's chosen activity prefs
      place_type_1:   prefs[0] || 'café',
      place_type_2:   prefs[1] || 'park',
      place_type_3:   prefs[2] || 'grocery store',
      activity_prefs: prefs.join(', ')      || 'open to anything',
      weather:        weather.description   || 'weather unknown',
      weather_mood:   getWeatherMood(weather.description),
      weather_advice: getWeatherAdvice(weather.description),
      time_of_day:    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
      streak:         String(missions.streak || 0),
      anchors:        (missions.anchors || []).join(', ') || 'none yet',
      total_missions: String(missions.total_completed || 0),
    };
  }

  async function ensureFreshWeatherForRadio() {
    const currentWeather = getWeather();
    const profile = getProfile();

    if (!isWeatherStale(currentWeather) && currentWeather?.lat != null) {
      return currentWeather;
    }

    const coords = await getBrowserCoords();
    const target = coords || profile.neighborhood || null;
    if (!target) return currentWeather;

    const nextWeather = await fetchWeather(target);
    setWeather(nextWeather);
    return nextWeather;
  }

  const conversation = useConversation({
    micMuted: isPaused,
    volume: isPaused ? 0 : 1,
    onConnect: () => {
      setIsPaused(false);
      setPhase('listening');
    },
    onDisconnect: () => {
      setIsPaused(false);
      setPhase('done');
      sessionStarted.current = false;
    },
    onMessage: ({ message, source }) => {
      setTranscript(prev => [...prev, { role: source, text: message }]);
      if (!isPaused) {
        setPhase(source === 'ai' ? 'speaking' : 'listening');
      }
    },
    onError: (message, context) => {
      console.error('ElevenLabs error:', message, context);
      setError('Connection issue. Please try again.');
      setIsPaused(false);
      setPhase('idle');
      sessionStarted.current = false;
    },
  });

  const startRadio = useCallback(async () => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    setError(null);
    setTranscript([]);
    setIsPaused(false);
    setPhase('opening');

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        stream.getTracks().forEach(t => t.stop());
      });

      await ensureFreshWeatherForRadio();

      conversation.startSession({
        agentId:          AGENT_ID,
        connectionType:   'websocket',
        dynamicVariables: buildDynamicVars(),
      });
    } catch (e) {
      console.error('Start session failed:', e);
      setError('Could not start radio. Check microphone permissions.');
      setPhase('idle');
      sessionStarted.current = false;
    }
  }, [conversation]);

  const stopRadio = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (e) {
      console.warn('endSession error:', e);
    }
    setIsPaused(false);
    setPhase('idle');
    sessionStarted.current = false;
  }, [conversation]);

  const pauseRadio = useCallback(() => {
    if (!sessionStarted.current) return;
    setIsPaused(true);
    setPhase('paused');
  }, []);

  const resumeRadio = useCallback(() => {
    if (!sessionStarted.current) return;
    setIsPaused(false);
    setPhase('listening');
  }, []);

  return {
    phase,
    transcript,
    error,
    isPaused,
    isSpeaking:  conversation.isSpeaking,
    isListening: conversation.isListening,
    status:      conversation.status,
    startRadio,
    pauseRadio,
    resumeRadio,
    stopRadio,
  };
}


function getWeatherMood(desc = '') {
  const d = desc.toLowerCase();
  if (d.includes('rain') || d.includes('drizzle')) return 'quiet and slow';
  if (d.includes('cloud') || d.includes('overcast'))  return 'soft and gray';
  if (d.includes('clear') || d.includes('sunny'))     return 'bright and open';
  if (d.includes('snow'))  return 'hushed and still';
  if (d.includes('wind'))  return 'a little restless';
  return 'its own kind of calm';
}

function getWeatherAdvice(desc = '') {
  const d = desc.toLowerCase();
  if (d.includes('rain') || d.includes('drizzle')) return 'bring an umbrella';
  if (d.includes('cloud') || d.includes('overcast'))  return 'maybe a light jacket';
  if (d.includes('clear') || d.includes('sunny'))     return 'something light works';
  if (d.includes('snow'))  return 'layer up';
  if (d.includes('wind'))  return 'a jacket you can button up';
  return 'dress for how you feel';
}
