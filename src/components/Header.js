import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Détermine si on doit afficher le bouton retour
  const showBackButton = location.pathname !== '/' && location.pathname !== '/players';
  
  // Titre dynamique selon la page
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Tournois';
    if (location.pathname === '/players') return 'Joueurs';
    if (location.pathname.includes('/tournament/')) {
      if (location.pathname.includes('/players')) return 'Participants';
      if (location.pathname.includes('/standings')) return 'Classement';
      if (location.pathname.includes('/round/')) return 'Ronde';
      if (location.pathname.includes('/bracket')) return 'Élimination';
      return 'Tournoi';
    }
    return 'FAB Tournament';
  };
  
  return (
    <header className="mobile-header">
      <div className="header-content">
        {showBackButton && (
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
            aria-label="Retour"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
        )}
        
        <h1 className="page-title">{getPageTitle()}</h1>
        
        <div className="header-actions">
          {/* Espace pour des actions futures (notifications, profil, etc.) */}
        </div>
      </div>
    </header>
  );
};

export default Header;