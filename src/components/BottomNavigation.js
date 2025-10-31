import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();
  
  const isActive = (paths) => {
    return paths.some(path => {
      if (path === '/' && location.pathname === '/') return true;
      if (path !== '/' && location.pathname.startsWith(path)) return true;
      return false;
    });
  };

  const getTournamentId = () => {
    const match = location.pathname.match(/\/tournament\/([^/]+)/);
    return match ? match[1] : null;
  };

  const tournamentId = getTournamentId();

  return (
    <nav className="bottom-nav">
      {/* Tab Accueil/Tournois */}
      <Link 
        to="/" 
        className={`nav-tab ${isActive(['/']) && !location.pathname.includes('/tournament/') ? 'active' : ''}`}
      >
        <div className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
        <span className="nav-label">Accueil</span>
      </Link>
      
      {/* Tab Joueurs */}
      <Link 
        to="/players" 
        className={`nav-tab ${isActive(['/players']) ? 'active' : ''}`}
      >
        <div className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.002 2.002 0 0 0 18.06 7h-.72c-.8 0-1.54.5-1.85 1.26l-1.92 5.78A2 2 0 0 0 15.49 16H16v6h4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5z"/>
            <path d="M5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm1.5 2h-3C2.9 8 2 8.9 2 10v3.5h2V22h4v-8.5h2V10c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <span className="nav-label">Joueurs</span>
      </Link>

      {/* Espace central pour le FAB */}
      <div className="nav-fab-space"></div>

      {/* Tabs contextuelles selon la page */}
      {tournamentId ? (
        <>
          {/* Tab Participants du tournoi */}
          <Link 
            to={`/tournament/${tournamentId}/players`}
            className={`nav-tab ${location.pathname.includes('/players') && tournamentId ? 'active' : ''}`}
          >
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 13c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm7.76-9.64l-1.68 1.69c.84 1.18.84 2.71 0 3.89l1.68 1.69c2.02-2.02 2.02-5.07 0-7.27zM20.07 2l-1.63 1.63c2.77 3.02 2.77 7.56 0 10.74L20.07 16c3.9-3.89 3.91-10.24 0-14.01z"/>
              </svg>
            </div>
            <span className="nav-label">Participants</span>
          </Link>

          {/* Tab Classement */}
          <Link 
            to={`/tournament/${tournamentId}/standings`}
            className={`nav-tab ${location.pathname.includes('/standings') ? 'active' : ''}`}
          >
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z"/>
              </svg>
            </div>
            <span className="nav-label">Classement</span>
          </Link>
        </>
      ) : (
        <>
          {/* Tab Stats (pour plus tard) */}
          <div className="nav-tab disabled">
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <span className="nav-label">Stats</span>
          </div>

          {/* Tab Réglages (pour plus tard) */}
          <div className="nav-tab disabled">
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </div>
            <span className="nav-label">Réglages</span>
          </div>
        </>
      )}
    </nav>
  );
};

export default BottomNavigation;