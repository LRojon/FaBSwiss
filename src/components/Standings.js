import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TournamentService, PlayerService, MatchService } from '../services/database';
import { PairingService } from '../services/pairing';
import { MATCH_RESULT } from '../models/types';

const Standings = () => {
  const { id: tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [standings, setStandings] = useState([]);
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
        
        // Calculer les standings
        const calculatedStandings = PairingService.calculateStandings(playersData, matchesData);
        
        // Calculer les tiebreakers détaillés
        const standingsWithTiebreakers = calculatedStandings.map((player, index) => {
          const playerMatches = matchesData.filter(m => 
            (m.player1Id === player.id || m.player2Id === player.id) && 
            m.result !== MATCH_RESULT.PENDING
          );
          
          // Calcul du Match Win Percentage des adversaires
          let opponentPoints = 0;
          let opponentTotalMatches = 0;
          let totalGamesWon = 0;
          let totalGamesPlayed = 0;
          
          playerMatches.forEach(match => {
            const isPlayer1 = match.player1Id === player.id;
            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
            const opponent = playersData.find(p => p.id === opponentId);
            
            if (opponent) {
              // Points de l'adversaire
              const opponentMatches = matchesData.filter(m => 
                (m.player1Id === opponentId || m.player2Id === opponentId) && 
                m.result !== MATCH_RESULT.PENDING
              );
              
              const opponentStats = calculatePlayerStats(opponent.id, opponentMatches);
              opponentPoints += opponentStats.points;
              opponentTotalMatches += opponentStats.totalMatches;
            }
            
            // Games du joueur
            if (isPlayer1) {
              totalGamesWon += match.player1Games || 0;
              totalGamesPlayed += (match.player1Games || 0) + (match.player2Games || 0);
            } else {
              totalGamesWon += match.player2Games || 0;
              totalGamesPlayed += (match.player1Games || 0) + (match.player2Games || 0);
            }
          });
          
          const opponentMatchWinPercentage = opponentTotalMatches > 0 
            ? Math.max(0.33, (opponentPoints / (opponentTotalMatches * 3))) 
            : 0.33;
          
          const gameWinPercentage = totalGamesPlayed > 0 
            ? Math.max(0.33, (totalGamesWon / totalGamesPlayed)) 
            : 0.33;
          
          return {
            ...player,
            rank: index + 1,
            matchesPlayed: playerMatches.length,
            totalGamesWon,
            totalGamesPlayed,
            gameWinPercentage: gameWinPercentage,
            opponentMatchWinPercentage: opponentMatchWinPercentage,
            tiebreakers: {
              opponentMatchWinPercentage,
              gameWinPercentage,
              opponentGameWinPercentage: 0 // Simplified for this implementation
            }
          };
        });
        
        setStandings(standingsWithTiebreakers);
      } catch (err) {
        setError('Erreur lors du chargement: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tournamentId]);

  const calculatePlayerStats = (playerId, matches) => {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    
    matches.forEach(match => {
      if (match.result === MATCH_RESULT.PENDING) return;
      
      if (match.player1Id === playerId) {
        if (match.result === MATCH_RESULT.PLAYER1_WIN) wins++;
        else if (match.result === MATCH_RESULT.PLAYER2_WIN) losses++;
        else if (match.result === MATCH_RESULT.DRAW) draws++;
      } else if (match.player2Id === playerId) {
        if (match.result === MATCH_RESULT.PLAYER2_WIN) wins++;
        else if (match.result === MATCH_RESULT.PLAYER1_WIN) losses++;
        else if (match.result === MATCH_RESULT.DRAW) draws++;
      }
    });
    
    return {
      wins,
      losses,
      draws,
      points: wins * 3 + draws,
      totalMatches: wins + losses + draws
    };
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'text-gold';
    if (rank === 2) return 'text-silver';
    if (rank === 3) return 'text-bronze';
    if (rank <= 8) return 'text-top8';
    return '';
  };

  if (loading) {
    return <div className="loading">Chargement du classement...</div>;
  }

  if (!tournament) {
    return <div className="error">Tournoi introuvable</div>;
  }

  return (
    <div>
      <div className="flex-between mb-3">
        <div>
          <h2>Classement</h2>
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

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Classement Général 
            <span className="ml-2">
              ({standings.filter(p => p.isActive).length} joueurs actifs)
            </span>
          </h3>
        </div>

        {standings.length === 0 ? (
          <p>Aucun joueur trouvé.</p>
        ) : (
          <div className="table-responsive">
            <table className="table standings-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Joueur</th>
                  <th>Héros</th>
                  <th>Points</th>
                  <th>V-D-N</th>
                  <th>Games</th>
                  <th>GW%</th>
                  <th>OMW%</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {standings.map(player => (
                  <tr key={player.id} className={!player.isActive ? 'text-muted' : ''}>
                    <td>
                      <span className={`rank ${getRankClass(player.rank)}`}>
                        {player.rank}
                      </span>
                    </td>
                    <td>
                      <strong>{player.name}</strong>
                    </td>
                    <td>
                      {player.hero || '—'}
                    </td>
                    <td>
                      <span className="points">{player.points}</span>
                    </td>
                    <td>
                      {player.wins}-{player.losses}-{player.draws}
                    </td>
                    <td>
                      {player.totalGamesWon || 0}/{player.totalGamesPlayed || 0}
                    </td>
                    <td>
                      {formatPercentage(player.gameWinPercentage || 0)}
                    </td>
                    <td>
                      {formatPercentage(player.opponentMatchWinPercentage || 0)}
                    </td>
                    <td>
                      <span className={`status-badge ${player.isActive ? 'status-complete' : 'status-pending'}`}>
                        {player.isActive ? 'Actif' : 'Drop'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Légende des tiebreakers */}
      <div className="card mt-3">
        <div className="card-header">
          <h3 className="card-title">Explication des Tiebreakers</h3>
        </div>
        <div className="grid grid-2">
          <div>
            <h4>Game Win Percentage (GW%)</h4>
            <p>
              Pourcentage de games gagnées par le joueur. 
              Minimum de 33.3% appliqué pour les calculs.
            </p>
          </div>
          <div>
            <h4>Opponent Match Win Percentage (OMW%)</h4>
            <p>
              Moyenne des pourcentages de victoires en match de tous les adversaires rencontrés. 
              Minimum de 33.3% par adversaire.
            </p>
          </div>
        </div>
      </div>

      {/* Top 8 */}
      {standings.length >= 8 && (
        <div className="card mt-3">
          <div className="card-header">
            <h3 className="card-title">Top 8</h3>
          </div>
          <div className="grid grid-2">
            {standings.slice(0, 8).map(player => (
              <div key={player.id} className="flex-between p-2 border rounded">
                <div>
                  <span className={`rank ${getRankClass(player.rank)}`}>
                    #{player.rank}
                  </span>
                  <strong className="ml-2">{player.name}</strong>
                </div>
                <div>
                  <span className="points">{player.points} pts</span>
                  <span className="ml-2 text-muted">
                    ({player.wins}-{player.losses}-{player.draws})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Standings;