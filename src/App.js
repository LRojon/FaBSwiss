import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Composants
import Header from './components/Header';
import BottomNavigation from './components/BottomNavigation';
import FloatingActionButton from './components/FloatingActionButton';
import TournamentList from './components/TournamentList';
import TournamentView from './components/TournamentView';
import PlayerManagement from './components/PlayerManagement';
import GlobalPlayerManagement from './components/GlobalPlayerManagement';
import RoundManagement from './components/RoundManagement';
import Standings from './components/Standings';
import EliminationBracket from './components/EliminationBracket';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<TournamentList />} />
            <Route path="/players" element={<GlobalPlayerManagement />} />
            <Route path="/tournament/:id" element={<TournamentView />} />
            <Route path="/tournament/:id/players" element={<PlayerManagement />} />
            <Route path="/tournament/:id/round/:roundNumber" element={<RoundManagement />} />
            <Route path="/tournament/:id/standings" element={<Standings />} />
            <Route path="/tournament/:id/bracket" element={<EliminationBracket />} />
          </Routes>
        </main>
        
        {/* Navigation mobile en bas */}
        <BottomNavigation />
        
        {/* FAB pour import/export */}
        <FloatingActionButton />
      </div>
    </Router>
  );
}

export default App;
