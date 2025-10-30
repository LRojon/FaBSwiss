import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  return (
    <header className="header">
      <h1>🗡️ FAB Swiss Tournament Manager</h1>
      <nav>
        <Link 
          to="/" 
          className={location.pathname === '/' ? 'active' : ''}
        >
          🏆 Tournois
        </Link>
        <Link 
          to="/players" 
          className={location.pathname === '/players' ? 'active' : ''}
        >
          👥 Joueurs
        </Link>
        {location.pathname.includes('/tournament/') && (
          <>
            <Link 
              to={`${location.pathname.split('/tournament/')[0]}/tournament/${location.pathname.split('/tournament/')[1].split('/')[0]}/players`}
            >
              📝 Participants
            </Link>
            <Link 
              to={`${location.pathname.split('/tournament/')[0]}/tournament/${location.pathname.split('/tournament/')[1].split('/')[0]}/standings`}
            >
              📊 Classement
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;