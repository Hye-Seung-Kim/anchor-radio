import { useState } from 'react';
import { ConversationProvider } from '@elevenlabs/react';
import { useAppState }      from './hooks/useAppState';
import AuthScreen           from './components/AuthScreen';
import OnboardingScreen     from './components/OnboardingScreen';
import PrefsScreen          from './components/PrefsScreen';
import RadioScreen          from './components/RadioScreen';
import MemoryScreen         from './components/MemoryScreen';
import MenuDrawer           from './components/MenuDrawer';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    screen, navigate,
    userId,
    profile, daily, weather, missions,
    loading, error, setError,
    handleSignIn, handleSignUp, handleSignOut,
    finishOnboarding, savePrefs, completeMission,
  } = useAppState();

  const renderScreen = () => {
    switch (screen) {
      case 'auth': return (
        <AuthScreen
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          loading={loading}
          error={error}
        />
      );
      case 's1': return (
        <OnboardingScreen
          onFinish={finishOnboarding}
          loading={loading}
          initialName={profile.name}
        />
      );
      case 'prefs': return (
        <PrefsScreen
          onDone={savePrefs}
          userId={userId}
          profileName={profile.name}
        />
      );
      case 's2': return (
        <RadioScreen
          userId={userId}
          profile={profile} weather={weather} missions={missions}
          onNavigate={navigate}
          onMenuOpen={() => setMenuOpen(true)}
          onMissionComplete={completeMission}
        />
      );
      case 's3': return (
        <MemoryScreen missions={missions} profile={profile} onNavigate={navigate} />
      );
      default: return null;
    }
  };

  return (
    <ConversationProvider>
    <div className="phone">
      <div className="screen active">
        {renderScreen()}
      </div>

      <MenuDrawer
        open={menuOpen}
        profile={profile}
        onNavigate={navigate}
        onSignOut={handleSignOut}
        onClose={() => setMenuOpen(false)}
      />

      {error && screen !== 'auth' && (
        <div id="api-error-banner" style={{ display:'block' }}
          onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
    </ConversationProvider>
  );
}
