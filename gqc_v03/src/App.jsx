import { useState, useEffect } from 'react';
import Header from './components/Header';
import ProgramList from './components/ProgramList';
import ProgramDetail from './components/ProgramDetail';
import LoginPage from './components/LoginPage';
import { getCurrentSession, signOut } from './utils/auth';

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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {selectedProgram ? (
          <ProgramDetail programId={selectedProgram} />
        ) : (
          <ProgramList onSelect={setSelectedProgram} />
        )}
      </main>
    </div>
  );
}

export default App;
