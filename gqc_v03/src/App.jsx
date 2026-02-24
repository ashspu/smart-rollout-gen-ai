import { useState, useEffect } from 'react';
import Header from './components/Header';
import ProgramList from './components/ProgramList';
import ProgramPage from './components/ProgramPage';
import LoginPage from './components/LoginPage';
import { getCurrentSession, signOut } from './utils/auth';

export const APP_VERSION = '0.5.0';

function App() {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    getCurrentSession().then((session) => {
      if (session) {
        setUserEmail(session.email);
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    });
  }, []);

  function handleAuthenticated(email) {
    setUserEmail(email);
    setAuthState('authenticated');
  }

  function handleSignOut() {
    signOut();
    setAuthState('unauthenticated');
    setUserEmail('');
    setSelectedProgram(null);
  }

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        onBack={selectedProgram ? () => setSelectedProgram(null) : null}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      {selectedProgram ? (
        <ProgramPage programId={selectedProgram} />
      ) : (
        <main className="max-w-6xl mx-auto px-6 py-8">
          <ProgramList onSelect={setSelectedProgram} />
        </main>
      )}
      <div className="fixed bottom-2 right-3 text-[10px] text-slate-300">v{APP_VERSION}</div>
    </div>
  );
}

export default App;
