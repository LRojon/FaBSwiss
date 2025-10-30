import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TournamentService, PlayerService, MatchService } from '../services/database';
import { MATCH_RESULT } from '../models/types';

const RoundManagement = () => {
  const { id: tournamentId, roundNumber } = useParams();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tournamentData, playersData, matchesData] = await Promise.all([
          TournamentService.getTournament(tournamentId),
          PlayerService.getPlayers(tournamentId),
          MatchService.getMatchesForRound(tournamentId, parseInt(roundNumber))
        ]);
        
        setTournament(tournamentData);
        setPlayers(playersData);
        setMatches(matchesData);
      } catch (err) {
        setError('Erreur lors du chargement: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tournamentId, roundNumber]);

  const reloadMatches = async () => {
    try {
      const matchesData = await MatchService.getMatchesForRound(
        tournamentId, 
        parseInt(roundNumber)
      );
      setMatches(matchesData);
    } catch (err) {
      setError('Erreur lors du rechargement: ' + err.message);
    }
  };

  const updateMatchResult = async (matchId, result, player1Games = 0, player2Games = 0) => {
    try {
      await MatchService.updateMatch(matchId, {
        result,
        player1Games,
        player2Games
      });
      await reloadMatches();
      setEditingMatch(null);
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + err.message);
    }
  };

  const handleQuickResult = async (matchId, result) => {
    let player1Games = 0;
    let player2Games = 0;

    if (result === MATCH_RESULT.PLAYER1_WIN) {
      player1Games = 2;
      player2Games = 0;
    } else if (result === MATCH_RESULT.PLAYER2_WIN) {
      player1Games = 0;
      player2Games = 2;
    } else if (result === MATCH_RESULT.DRAW) {
      player1Games = 1;
      player2Games = 1;
    }

    await updateMatchResult(matchId, result, player1Games, player2Games);
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Inconnu';
  };

  const getPlayerHero = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.hero || '';
  };

  const getResultText = (result) => {
    switch (result) {
      case MATCH_RESULT.PLAYER1_WIN:
        return 'Victoire J1';
      case MATCH_RESULT.PLAYER2_WIN:
        return 'Victoire J2';
      case MATCH_RESULT.DRAW:
        return 'Match nul';
      case MATCH_RESULT.PENDING:
        return 'En attente';
      default:
        return result;
    }
  };

  const getResultClass = (result) => {
    switch (result) {
      case MATCH_RESULT.PENDING:
        return 'status-pending';
      default:
        return 'status-complete';
    }
  };

  if (loading) {
    return <div className="loading">Chargement du round...</div>;
  }

  if (!tournament) {
    return <div className="error">Tournoi introuvable</div>;
  }

  return (
    <div>
      <div className="flex-between mb-3">
        <div>
          <h2>Round {roundNumber}</h2>
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
          <h3 className="card-title">
            Matches du Round {roundNumber} 
            <span className="ml-2">
              ({matches.filter(m => m.result !== MATCH_RESULT.PENDING).length}/{matches.length} terminés)
            </span>
          </h3>
        </div>

        {matches.length === 0 ? (
          <p>Aucun match trouvé pour ce round.</p>
        ) : (
          <div className="grid">
            {matches.map(match => {
              const player1Name = getPlayerName(match.player1Id);
              const player2Name = getPlayerName(match.player2Id);
              const player1Hero = getPlayerHero(match.player1Id);
              const player2Hero = getPlayerHero(match.player2Id);
              const isEditing = editingMatch === match.id;

              return (
                <div key={match.id} className="match-card">
                  <div className="match-players">
                    <div className="player-info">
                      <div className="player-name">{player1Name}</div>
                      {player1Hero && <div className="player-hero">{player1Hero}</div>}
                    </div>
                    <div className="vs-indicator">VS</div>
                    <div className="player-info">
                      <div className="player-name">{player2Name || 'Bye'}</div>
                      {player2Hero && <div className="player-hero">{player2Hero}</div>}
                    </div>
                  </div>

                  {match.table && (
                    <div className="text-center mb-2">
                      <strong>Table {match.table}</strong>
                    </div>
                  )}

                  <div className="text-center mb-2">
                    <span className={`status-badge ${getResultClass(match.result)}`}>
                      {getResultText(match.result)}
                    </span>
                    {match.result !== MATCH_RESULT.PENDING && (
                      <div className="mt-1">
                        Score: {match.player1Games} - {match.player2Games}
                      </div>
                    )}
                  </div>

                  {!isEditing && match.result === MATCH_RESULT.PENDING && (
                    <div className="flex gap-1 justify-center">
                      {!match.player2Id ? (
                        // Bye automatique
                        <button
                          className="btn btn-success btn-small"
                          onClick={() => handleQuickResult(match.id, MATCH_RESULT.PLAYER1_WIN)}
                        >
                          Bye confirmé
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-success btn-small"
                            onClick={() => handleQuickResult(match.id, MATCH_RESULT.PLAYER1_WIN)}
                            title={`Victoire de ${player1Name}`}
                          >
                            J1 gagne
                          </button>
                          <button
                            className="btn btn-success btn-small"
                            onClick={() => handleQuickResult(match.id, MATCH_RESULT.PLAYER2_WIN)}
                            title={`Victoire de ${player2Name}`}
                          >
                            J2 gagne
                          </button>
                          <button
                            className="btn btn-warning btn-small"
                            onClick={() => handleQuickResult(match.id, MATCH_RESULT.DRAW)}
                          >
                            Nul
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => setEditingMatch(match.id)}
                          >
                            Détail
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <MatchResultEditor
                      match={match}
                      player1Name={player1Name}
                      player2Name={player2Name}
                      onSave={updateMatchResult}
                      onCancel={() => setEditingMatch(null)}
                    />
                  )}

                  {!isEditing && match.result !== MATCH_RESULT.PENDING && (
                    <div className="text-center mt-2">
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => setEditingMatch(match.id)}
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Résumé du round */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Résumé du Round</h3>
        </div>
        <div className="grid grid-3">
          <div className="text-center">
            <h4>Matches terminés</h4>
            <p className="text-xl">{matches.filter(m => m.result !== MATCH_RESULT.PENDING).length}</p>
          </div>
          <div className="text-center">
            <h4>Matches en cours</h4>
            <p className="text-xl">{matches.filter(m => m.result === MATCH_RESULT.PENDING).length}</p>
          </div>
          <div className="text-center">
            <h4>Total matches</h4>
            <p className="text-xl">{matches.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour éditer les résultats détaillés
const MatchResultEditor = ({ match, player1Name, player2Name, onSave, onCancel }) => {
  const [result, setResult] = useState(match.result);
  const [player1Games, setPlayer1Games] = useState(match.player1Games || 0);
  const [player2Games, setPlayer2Games] = useState(match.player2Games || 0);

  const handleSave = () => {
    onSave(match.id, result, parseInt(player1Games), parseInt(player2Games));
  };

  const handleResultChange = (newResult) => {
    setResult(newResult);
    
    // Auto-fill games based on result
    if (newResult === MATCH_RESULT.PLAYER1_WIN && (player1Games < player2Games || player1Games < 2)) {
      setPlayer1Games(2);
      setPlayer2Games(Math.min(player2Games, 1));
    } else if (newResult === MATCH_RESULT.PLAYER2_WIN && (player2Games < player1Games || player2Games < 2)) {
      setPlayer2Games(2);
      setPlayer1Games(Math.min(player1Games, 1));
    } else if (newResult === MATCH_RESULT.DRAW) {
      setPlayer1Games(1);
      setPlayer2Games(1);
    }
  };

  return (
    <div className="mt-3 p-3 border rounded">
      <h4>Édition du résultat</h4>
      
      <div className="form-group">
        <label>Résultat du match</label>
        <select 
          className="form-control" 
          value={result} 
          onChange={(e) => handleResultChange(e.target.value)}
        >
          <option value={MATCH_RESULT.PENDING}>En attente</option>
          <option value={MATCH_RESULT.PLAYER1_WIN}>Victoire de {player1Name}</option>
          <option value={MATCH_RESULT.PLAYER2_WIN}>Victoire de {player2Name}</option>
          <option value={MATCH_RESULT.DRAW}>Match nul</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Games gagnées par {player1Name}</label>
          <input
            type="number"
            min="0"
            max="3"
            className="form-control"
            value={player1Games}
            onChange={(e) => setPlayer1Games(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Games gagnées par {player2Name}</label>
          <input
            type="number"
            min="0"
            max="3"
            className="form-control"
            value={player2Games}
            onChange={(e) => setPlayer2Games(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-success" onClick={handleSave}>
          Sauvegarder
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
};

export default RoundManagement;