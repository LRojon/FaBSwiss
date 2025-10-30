import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TournamentService, PlayerService, MatchService } from '../services/database';
import { PairingService } from '../services/pairing';

const EliminationBracket = () => {
  const { id: tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tournamentData, playersData, matchesData] = await Promise.all([
          TournamentService.getTournament(tournamentId),
          PlayerService.getPlayers(tournamentId),
          MatchService.getMatches(tournamentId)
        ]);
        
        setTournament(tournamentData);
        
        // Calculer les standings et prendre le top cut
        const standings = PairingService.calculateStandings(playersData, matchesData);
        const topCutSize = tournamentData.topCutSize || 8;
        const topCutPlayers = standings.slice(0, topCutSize);
        
        setTopPlayers(topCutPlayers);
      } catch (err) {
        setError('Erreur lors du chargement: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tournamentId]);

  if (loading) {
    return <div className="loading">Chargement de l'arbre d'élimination...</div>;
  }

  if (!tournament) {
    return <div className="error">Tournoi introuvable</div>;
  }

  const topCutSize = tournament.topCutSize || 8;

  return (
    <div>
      <div className="flex-between mb-3">
        <div>
          <h2>Arbre d'Élimination - Top {topCutSize}</h2>
          <h3 className="text-left">{tournament.name}</h3>
        </div>
        <div className="flex gap-2">
          <Link 
            to={`/tournament/${tournamentId}`}
            className="btn btn-secondary"
          >
            Retour au Tournoi
          </Link>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
          <button 
            className="btn btn-small" 
            onClick={() => setError(null)}
            style={{ marginLeft: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Joueurs Qualifiés</h3>
        </div>
        
        {topPlayers.length < topCutSize ? (
          <div className="text-center">
            <p>Le tournoi suisse n'est pas encore terminé.</p>
            <p>Seuls {topPlayers.length} joueurs sur {topCutSize} sont déterminés.</p>
            <Link 
              to={`/tournament/${tournamentId}/standings`}
              className="btn btn-primary"
            >
              Voir le Classement
            </Link>
          </div>
        ) : (
          <div>
            {topCutSize === 8 ? (
              <BracketTop8 players={topPlayers} />
            ) : topCutSize === 4 ? (
              <BracketTop4 players={topPlayers} />
            ) : (
              <SimpleBracket players={topPlayers} />
            )}
          </div>
        )}
      </div>

      {/* Information sur les matches */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Note sur l'Implémentation</h3>
        </div>
        <div>
          <p>
            <strong>Cette version basique affiche le bracket théorique.</strong>
          </p>
          <p>
            Pour une implémentation complète, il faudrait ajouter :
          </p>
          <ul>
            <li>Création automatique des matches d'élimination</li>
            <li>Interface pour saisir les résultats</li>
            <li>Mise à jour automatique du bracket</li>
            <li>Gestion des différents formats (single/double élimination)</li>
          </ul>
          <p>
            En attendant, vous pouvez continuer à utiliser l'interface manuelle des rounds 
            pour gérer les phases d'élimination.
          </p>
        </div>
      </div>
    </div>
  );
};

// Composant pour un bracket Top 8
const BracketTop8 = ({ players }) => {
  const quarterfinals = [
    { player1: players[0], player2: players[7] },
    { player1: players[3], player2: players[4] },
    { player1: players[1], player2: players[6] },
    { player1: players[2], player2: players[5] }
  ];

  return (
    <div className="bracket-container">
      <h4>Quarts de Finale</h4>
      <div className="grid grid-2 mb-3">
        {quarterfinals.map((match, index) => (
          <div key={index} className="match-card">
            <div className="match-players">
              <div className="player-info">
                <div className="player-name">#{match.player1.rank} {match.player1.name}</div>
                <div className="player-hero">{match.player1.hero || ''}</div>
                <div className="text-muted">{match.player1.points} pts</div>
              </div>
              <div className="vs-indicator">VS</div>
              <div className="player-info">
                <div className="player-name">#{match.player2.rank} {match.player2.name}</div>
                <div className="player-hero">{match.player2.hero || ''}</div>
                <div className="text-muted">{match.player2.points} pts</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h4>Demi-Finales</h4>
      <div className="grid grid-2 mb-3">
        <div className="match-card">
          <div className="text-center">
            <div>Vainqueur QF1 vs Vainqueur QF2</div>
          </div>
        </div>
        <div className="match-card">
          <div className="text-center">
            <div>Vainqueur QF3 vs Vainqueur QF4</div>
          </div>
        </div>
      </div>

      <h4>Finale</h4>
      <div className="match-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="text-center">
          <div>Vainqueur DF1 vs Vainqueur DF2</div>
        </div>
      </div>
    </div>
  );
};

// Composant pour un bracket Top 4
const BracketTop4 = ({ players }) => {
  const semifinals = [
    { player1: players[0], player2: players[3] },
    { player1: players[1], player2: players[2] }
  ];

  return (
    <div className="bracket-container">
      <h4>Demi-Finales</h4>
      <div className="grid grid-2 mb-3">
        {semifinals.map((match, index) => (
          <div key={index} className="match-card">
            <div className="match-players">
              <div className="player-info">
                <div className="player-name">#{match.player1.rank} {match.player1.name}</div>
                <div className="player-hero">{match.player1.hero || ''}</div>
                <div className="text-muted">{match.player1.points} pts</div>
              </div>
              <div className="vs-indicator">VS</div>
              <div className="player-info">
                <div className="player-name">#{match.player2.rank} {match.player2.name}</div>
                <div className="player-hero">{match.player2.hero || ''}</div>
                <div className="text-muted">{match.player2.points} pts</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h4>Finale</h4>
      <div className="match-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="text-center">
          <div>Vainqueur DF1 vs Vainqueur DF2</div>
        </div>
      </div>
    </div>
  );
};

// Composant pour un bracket simple
const SimpleBracket = ({ players }) => {
  return (
    <div className="bracket-container">
      <h4>Joueurs Qualifiés</h4>
      <div className="grid grid-2">
        {players.map(player => (
          <div key={player.id} className="card">
            <div className="flex-between">
              <div>
                <div className="player-name">#{player.rank} {player.name}</div>
                <div className="player-hero">{player.hero || 'Aucun héros'}</div>
              </div>
              <div className="text-right">
                <div className="points">{player.points} pts</div>
                <div className="text-muted">{player.wins}-{player.losses}-{player.draws}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EliminationBracket;