import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TournamentService, PlayerService, RoundService, MatchService } from '../services/database';
import { PairingService } from '../services/pairing';
import { TOURNAMENT_STATUS, ROUND_TYPE, createRound } from '../models/types';

const TournamentView = () => {
  const { id: tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentMatches, setCurrentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tournamentData, playersData, roundsData] = await Promise.all([
          TournamentService.getTournament(tournamentId),
          PlayerService.getPlayers(tournamentId),
          RoundService.getRounds(tournamentId)
        ]);
        
        setTournament(tournamentData);
        setPlayers(playersData);
        setRounds(roundsData);

        // Charger les matches du round actuel
        if (tournamentData && tournamentData.currentRound > 0) {
          const matches = await MatchService.getMatchesForRound(
            tournamentId, 
            tournamentData.currentRound
          );
          setCurrentMatches(matches);
        }
      } catch (err) {
        setError('Erreur lors du chargement: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tournamentId]);

  const reloadData = async () => {
    try {
      const [tournamentData, playersData, roundsData] = await Promise.all([
        TournamentService.getTournament(tournamentId),
        PlayerService.getPlayers(tournamentId),
        RoundService.getRounds(tournamentId)
      ]);
      
      setTournament(tournamentData);
      setPlayers(playersData);
      setRounds(roundsData);

      if (tournamentData && tournamentData.currentRound > 0) {
        const matches = await MatchService.getMatchesForRound(
          tournamentId, 
          tournamentData.currentRound
        );
        setCurrentMatches(matches);
      }
    } catch (err) {
      setError('Erreur lors du rechargement: ' + err.message);
    }
  };

  const startTournament = async () => {
    try {
      const activePlayers = players.filter(p => p.isActive);
      if (activePlayers.length < 2) {
        setError('Au moins 2 joueurs actifs sont nécessaires pour commencer le tournoi');
        return;
      }

      await TournamentService.updateTournament(tournamentId, {
        status: TOURNAMENT_STATUS.SWISS_ROUNDS,
        currentRound: 1
      });

      await startNewRound();
    } catch (err) {
      setError('Erreur lors du démarrage: ' + err.message);
    }
  };

  const startNewRound = async () => {
    try {
      const activePlayers = players.filter(p => p.isActive);
      const allMatches = await MatchService.getMatches(tournamentId);
      const nextRoundNumber = (tournament.currentRound || 0) + 1;

      // Générer les pairings
      const pairings = PairingService.generateSwissPairings(
        activePlayers,
        allMatches,
        nextRoundNumber
      );

      // Créer le round
      const round = createRound(nextRoundNumber, ROUND_TYPE.SWISS);
      const createdRound = await RoundService.createRound(tournamentId, round);

      // Créer les matches
      for (const pairing of pairings) {
        await MatchService.createMatch(tournamentId, createdRound.id, pairing);
      }

      // Mettre à jour le tournoi
      await TournamentService.updateTournament(tournamentId, {
        currentRound: nextRoundNumber
      });

      await reloadData();
    } catch (err) {
      setError('Erreur lors de la création du round: ' + err.message);
    }
  };

  const startTopCut = async (topCutSize = 8) => {
    try {
      await TournamentService.updateTournament(tournamentId, {
        status: TOURNAMENT_STATUS.TOP_CUT,
        topCutSize
      });
      await reloadData();
    } catch (err) {
      setError('Erreur lors du démarrage du top cut: ' + err.message);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case TOURNAMENT_STATUS.SETUP:
        return 'Configuration';
      case TOURNAMENT_STATUS.SWISS_ROUNDS:
        return 'Rounds Suisses';
      case TOURNAMENT_STATUS.TOP_CUT:
        return 'Top Cut';
      case TOURNAMENT_STATUS.FINISHED:
        return 'Terminé';
      default:
        return status;
    }
  };

  const canStartTournament = () => {
    return tournament?.status === TOURNAMENT_STATUS.SETUP && 
           players.filter(p => p.isActive).length >= 2;
  };

  const canStartNewRound = () => {
    return tournament?.status === TOURNAMENT_STATUS.SWISS_ROUNDS &&
           currentMatches.length > 0 &&
           currentMatches.every(m => m.result !== 'pending');
  };

  const canStartTopCut = () => {
    return tournament?.status === TOURNAMENT_STATUS.SWISS_ROUNDS &&
           currentMatches.length > 0 &&
           currentMatches.every(m => m.result !== 'pending');
  };

  if (loading) {
    return <div className="loading">Chargement du tournoi...</div>;
  }

  if (!tournament) {
    return <div className="error">Tournoi introuvable</div>;
  }

  return (
    <div>
      <div className="flex-between mb-3">
        <div>
          <h2>{tournament.name}</h2>
          <span className={`status-badge ${tournament.status}`}>
            {getStatusText(tournament.status)}
          </span>
        </div>
        <div className="flex gap-2">
          <Link 
            to={`/tournament/${tournamentId}/players`}
            className="btn btn-secondary"
          >
            Gérer les Joueurs
          </Link>
          <Link 
            to={`/tournament/${tournamentId}/standings`}
            className="btn btn-secondary"
          >
            Classement
          </Link>
          <Link to="/" className="btn btn-secondary">
            Retour
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

      <div className="grid grid-2">
        {/* Informations du tournoi */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Informations</h3>
          </div>
          <div>
            <p><strong>Joueurs inscrits:</strong> {players.length}</p>
            <p><strong>Joueurs actifs:</strong> {players.filter(p => p.isActive).length}</p>
            <p><strong>Round actuel:</strong> {tournament.currentRound || 0}</p>
            <p><strong>Total des rounds:</strong> {rounds.length}</p>
            <p><strong>Créé le:</strong> {new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Actions</h3>
          </div>
          <div className="flex flex-direction-column gap-2">
            {canStartTournament() && (
              <button 
                className="btn btn-success"
                onClick={startTournament}
              >
                Commencer le Tournoi
              </button>
            )}

            {canStartNewRound() && (
              <button 
                className="btn btn-primary"
                onClick={startNewRound}
              >
                Commencer le Round {(tournament.currentRound || 0) + 1}
              </button>
            )}

            {canStartTopCut() && (
              <div>
                <button 
                  className="btn btn-warning"
                  onClick={() => startTopCut(8)}
                >
                  Commencer Top 8
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={() => startTopCut(4)}
                >
                  Commencer Top 4
                </button>
              </div>
            )}

            {tournament.status === TOURNAMENT_STATUS.TOP_CUT && (
              <Link 
                to={`/tournament/${tournamentId}/bracket`}
                className="btn btn-primary"
              >
                Voir l'Arbre d'Élimination
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Round actuel */}
      {tournament.currentRound > 0 && (
        <div className="card mt-3">
          <div className="card-header">
            <div className="flex-between">
              <h3 className="card-title">Round {tournament.currentRound}</h3>
              <Link 
                to={`/tournament/${tournamentId}/round/${tournament.currentRound}`}
                className="btn btn-primary"
              >
                Gérer ce Round
              </Link>
            </div>
          </div>

          {currentMatches.length === 0 ? (
            <p>Aucun match pour ce round.</p>
          ) : (
            <div className="grid grid-2">
              {currentMatches.map(match => {
                const player1 = players.find(p => p.id === match.player1Id);
                const player2 = players.find(p => p.id === match.player2Id);
                
                return (
                  <div key={match.id} className="match-card">
                    <div className="match-players">
                      <div className="player-info">
                        <div className="player-name">{player1?.name || 'Bye'}</div>
                        <div className="player-hero">{player1?.hero || ''}</div>
                      </div>
                      <div className="vs-indicator">VS</div>
                      <div className="player-info">
                        <div className="player-name">{player2?.name || 'Bye'}</div>
                        <div className="player-hero">{player2?.hero || ''}</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      {match.table && <p><strong>Table {match.table}</strong></p>}
                      <span className={`status-badge ${match.result === 'pending' ? 'status-pending' : 'status-complete'}`}>
                        {match.result === 'pending' ? 'En cours' : 'Terminé'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Historique des rounds */}
      {rounds.length > 0 && (
        <div className="card mt-3">
          <div className="card-header">
            <h3 className="card-title">Historique des Rounds</h3>
          </div>
          <div className="grid grid-3">
            {rounds.map(round => (
              <div key={round.id} className="card">
                <h4>Round {round.roundNumber}</h4>
                <p><strong>Type:</strong> {round.type === ROUND_TYPE.SWISS ? 'Suisse' : 'Élimination'}</p>
                <p><strong>Statut:</strong> {round.isComplete ? 'Terminé' : 'En cours'}</p>
                <Link 
                  to={`/tournament/${tournamentId}/round/${round.roundNumber}`}
                  className="btn btn-small btn-secondary"
                >
                  Voir les Détails
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentView;