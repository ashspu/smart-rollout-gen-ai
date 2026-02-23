import { useState } from 'react';
import Header from './components/Header';
import ProgramList from './components/ProgramList';
import ProgramDetail from './components/ProgramDetail';

function App() {
  const [selectedProgram, setSelectedProgram] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onBack={selectedProgram ? () => setSelectedProgram(null) : null} />
      
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
