import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TournamentService, DataService } from '../services/database';
import { createTournament, TOURNAMENT_STATUS } from '../models/types';

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [hasPlayoffs, setHasPlayoffs] = useState(true);
  const [playoffSize, setPlayoffSize] = useState(8);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentList = await TournamentService.getAllTournaments();
      setTournaments(tournamentList);
    } catch (err) {
      setError('Erreur lors du chargement des tournois: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!newTournamentName.trim()) return;

    try {
      const tournament = createTournament(newTournamentName);
      tournament.hasPlayoffs = hasPlayoffs;
      tournament.playoffSize = hasPlayoffs ? playoffSize : 0;
      await TournamentService.createTournament(tournament);
      setNewTournamentName('');
      setHasPlayoffs(true);
      setPlayoffSize(8);
      setShowCreateForm(false);
      await loadTournaments();
    } catch (err) {
      setError('Erreur lors de la création du tournoi: ' + err.message);
    }
  };

  const handleDeleteTournament = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.')) {
      return;
    }

    try {
      await TournamentService.deleteTournament(id);
      await loadTournaments();
    } catch (err) {
      setError('Erreur lors de la suppression: ' + err.message);
    }
  };

  const handleImportTournament = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await DataService.importTournament(file);
      await loadTournaments();
      event.target.value = ''; // Reset file input
    } catch (err) {
      setError('Erreur lors de l\'import: ' + err.message);
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

  const getStatusClass = (status) => {
    switch (status) {
      case TOURNAMENT_STATUS.SETUP:
        return 'status-setup';
      case TOURNAMENT_STATUS.SWISS_ROUNDS:
        return 'status-swiss';
      case TOURNAMENT_STATUS.TOP_CUT:
        return 'status-topcut';
      case TOURNAMENT_STATUS.FINISHED:
        return 'status-finished';
      default:
        return 'status-setup';
    }
  };

  if (loading) {
    return <div className="loading">Chargement des tournois...</div>;
  }

  return (
    <div>
      <div className="flex-between mb-3">
        <h2>Mes Tournois Flesh and Blood</h2>
        <div className="flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Nouveau Tournoi
          </button>
          <label className="btn btn-secondary">
            Importer
            <input 
              type="file" 
              accept=".json"
              onChange={handleImportTournament}
              style={{ display: 'none' }}
            />
          </label>
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

      {showCreateForm && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Créer un nouveau tournoi</h3>
          </div>
          <form onSubmit={handleCreateTournament}>
            <div className="form-group">
              <label htmlFor="tournamentName">Nom du tournoi</label>
              <input
                type="text"
                id="tournamentName"
                className="form-control"
                value={newTournamentName}
                onChange={(e) => setNewTournamentName(e.target.value)}
                placeholder="Ex: Tournoi FAB Local - Décembre 2024"
                required
              />
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={hasPlayoffs}
                  onChange={(e) => setHasPlayoffs(e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Inclure des playoffs (Top Cut)
              </label>
            </div>

            {hasPlayoffs && (
              <div className="form-group">
                <label htmlFor="playoffSize">Taille du Top Cut</label>
                <select
                  id="playoffSize"
                  className="form-control"
                  value={playoffSize}
                  onChange={(e) => setPlayoffSize(parseInt(e.target.value))}
                >
                  <option value={4}>Top 4</option>
                  <option value={8}>Top 8</option>
                  <option value={16}>Top 16</option>
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" className="btn btn-success">
                Créer
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTournamentName('');
                  setHasPlayoffs(true);
                  setPlayoffSize(8);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {tournaments.length === 0 ? (
        <div className="card text-center">
          <p>Aucun tournoi trouvé.</p>
          <p>Créez votre premier tournoi pour commencer !</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {tournaments.map(tournament => (
            <div key={tournament.id} className="card">
              <div className="card-header">
                <div className="flex-between">
                  <h3 className="card-title">{tournament.name}</h3>
                  <span className={`status-badge ${getStatusClass(tournament.status)}`}>
                    {getStatusText(tournament.status)}
                  </span>
                </div>
              </div>
              
              <div className="mb-2">
                <p><strong>Créé le:</strong> {new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</p>
                <p><strong>Dernière modification:</strong> {new Date(tournament.updatedAt).toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="flex gap-2">
                <Link 
                  to={`/tournament/${tournament.id}`}
                  className="btn btn-primary"
                >
                  Ouvrir
                </Link>
                <Link 
                  to={`/tournament/${tournament.id}/players`}
                  className="btn btn-secondary"
                >
                  Joueurs
                </Link>
                <button
                  className="btn btn-warning btn-small"
                  onClick={() => DataService.exportTournament(tournament.id)}
                  title="Exporter le tournoi"
                >
                  📥
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteTournament(tournament.id)}
                  title="Supprimer le tournoi"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Informations sur l'application */}
      <div className="card mt-3">
        <div className="card-header">
          <h3 className="card-title">À propos de FAB Swiss</h3>
        </div>
        <div>
          <p>
            <strong>FAB Swiss Tournament Manager</strong> est une application web progressive (PWA) 
            pour gérer des tournois Flesh and Blood.
          </p>
          
          <h4>Fonctionnalités :</h4>
          <ul>
            <li>✅ Gestion complète des joueurs et héros</li>
            <li>✅ Système de pairing suisse automatique</li>
            <li>✅ Interface simple pour saisir les résultats</li>
            <li>✅ Calcul automatique des classements et tiebreakers</li>
            <li>✅ Visualisation des arbres d'élimination (Top 4/8)</li>
            <li>✅ Sauvegarde locale des données (IndexedDB)</li>
            <li>✅ Export/import des tournois</li>
            <li>✅ Fonctionne hors ligne (PWA)</li>
          </ul>

          <p className="text-muted">
            Version 1.0 - Toutes les données sont stockées localement dans votre navigateur.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TournamentList;