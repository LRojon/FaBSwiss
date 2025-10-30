import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlayerService, TournamentPlayerService, TournamentService } from '../services/database';
import { HEROES } from '../models/types';

const PlayerManagement = () => {
  const { id: tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [tournamentPlayers, setTournamentPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    playerId: '',
    hero: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tournamentData, tournamentPlayersData, allPlayersData] = await Promise.all([
          TournamentService.getTournament(tournamentId),
          TournamentPlayerService.getTournamentPlayers(tournamentId),
          PlayerService.getAllPlayers()
        ]);
        setTournament(tournamentData);
        setTournamentPlayers(tournamentPlayersData);
        setAllPlayers(allPlayersData.filter(p => p.isActive));
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
      const [tournamentData, tournamentPlayersData] = await Promise.all([
        TournamentService.getTournament(tournamentId),
        TournamentPlayerService.getTournamentPlayers(tournamentId)
      ]);
      setTournament(tournamentData);
      setTournamentPlayers(tournamentPlayersData);
    } catch (err) {
      setError('Erreur lors du rechargement: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.playerId) return;

    try {
      if (editingPlayer) {
        await TournamentPlayerService.updateTournamentPlayer(
          tournamentId, 
          editingPlayer.id, 
          { hero: formData.hero }
        );
      } else {
        await TournamentPlayerService.addPlayerToTournament(
          tournamentId, 
          formData.playerId, 
          formData.hero || null
        );
      }
      
      resetForm();
      await reloadData();
    } catch (err) {
      setError('Erreur lors de la sauvegarde: ' + err.message);
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      playerId: player.id,
      hero: player.hero || ''
    });
    setShowAddForm(true);
  };

  const handleRemove = async (playerId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce joueur du tournoi ?')) {
      return;
    }

    try {
      await TournamentPlayerService.removePlayerFromTournament(tournamentId, playerId);
      await reloadData();
    } catch (err) {
      setError('Erreur lors de la suppression: ' + err.message);
    }
  };

  const handleToggleActive = async (player) => {
    try {
      await TournamentPlayerService.updateTournamentPlayer(
        tournamentId, 
        player.id, 
        { isActive: !player.isActive }
      );
      await reloadData();
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ playerId: '', hero: '' });
    setEditingPlayer(null);
    setShowAddForm(false);
  };

  const getHeroOptions = () => {
    const options = [{ value: '', label: '🎭 Aucun héros sélectionné' }];
    
    Object.entries(HEROES).forEach(([heroName, heroClass]) => {
      options.push({
        value: heroName,
        label: `🗡️ ${heroName} (${heroClass})`
      });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  };

  const getAvailablePlayers = () => {
    const participatingPlayerIds = tournamentPlayers.map(tp => tp.id);
    return allPlayers.filter(player => !participatingPlayerIds.includes(player.id));
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!tournament) {
    return <div className="error">Tournoi introuvable</div>;
  }

  const availablePlayers = getAvailablePlayers();

  return (
    <div>
      <div className="flex-between mb-3">
        <div>
          <h2>📝 Participants au Tournoi</h2>
          <h3 className="text-left">{tournament.name}</h3>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
            disabled={availablePlayers.length === 0}
          >
            ➕ Ajouter un Participant
          </button>
          <Link to="/players" className="btn btn-secondary">
            👥 Gérer les Joueurs
          </Link>
          <Link to={`/tournament/${tournamentId}`} className="btn btn-secondary">
            🏆 Retour au Tournoi
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

      {availablePlayers.length === 0 && !showAddForm && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">🚫 Aucun joueur disponible</h3>
          </div>
          <p>
            Tous les joueurs actifs de votre base de données participent déjà à ce tournoi.
          </p>
          <Link to="/players" className="btn btn-primary">
            👥 Ajouter de nouveaux joueurs
          </Link>
        </div>
      )}

      {showAddForm && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">
              {editingPlayer ? '✏️ Modifier le participant' : '➕ Ajouter un participant'}
            </h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              {!editingPlayer && (
                <div className="form-group">
                  <label htmlFor="playerId">👤 Joueur</label>
                  <select
                    id="playerId"
                    className="form-control"
                    value={formData.playerId}
                    onChange={(e) => setFormData({ ...formData, playerId: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un joueur...</option>
                    {availablePlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="playerHero">🗡️ Héros FAB</label>
                <select
                  id="playerHero"
                  className="form-control"
                  value={formData.hero}
                  onChange={(e) => setFormData({ ...formData, hero: e.target.value })}
                >
                  {getHeroOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <button type="submit" className="btn btn-success">
                  {editingPlayer ? '💾 Modifier' : '➕ Ajouter'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  ❌ Annuler
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            🎯 Participants inscrits ({tournamentPlayers.filter(p => p.isActive).length} actifs / {tournamentPlayers.length} total)
          </h3>
        </div>

        {tournamentPlayers.length === 0 ? (
          <div className="text-center">
            <p>🎭 Aucun participant inscrit pour l'instant.</p>
            <p>Ajoutez des participants pour commencer le tournoi !</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>👤 Nom</th>
                  <th>🗡️ Héros</th>
                  <th className="hide-mobile">🎭 Classe</th>
                  <th className="hide-mobile">🔘 Statut</th>
                  <th>📊 Score</th>
                  <th>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournamentPlayers.map(player => (
                  <tr key={player.id} className={!player.isActive ? 'text-muted' : ''}>
                    <td>
                      <strong>{player.name || 'Nom inconnu'}</strong>
                      {!player.name && <span style={{color: 'var(--error-color)'}}> ⚠️</span>}
                    </td>
                    <td>
                      {player.hero || '—'}
                    </td>
                    <td className="hide-mobile">
                      {player.hero ? HEROES[player.hero] || '—' : '—'}
                    </td>
                    <td className="hide-mobile">
                      <span className={`status-badge ${player.isActive ? 'status-complete' : 'status-pending'}`}>
                        {player.isActive ? '✅ Actif' : '⏸️ Drop'}
                      </span>
                    </td>
                    <td>
                      <div className="mobile-player-info hide-desktop">
                        <small>
                          {player.hero ? HEROES[player.hero] || '—' : '—'} • 
                          {player.isActive ? ' ✅ Actif' : ' ⏸️ Drop'}
                        </small>
                      </div>
                      {player.wins || 0}-{player.losses || 0}-{player.draws || 0} ({player.points || 0} pts)
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-warning btn-small"
                          onClick={() => handleEdit(player)}
                          title="Modifier le héros"
                        >
                          ✏️
                        </button>
                        <button
                          className={`btn btn-small ${player.isActive ? 'btn-secondary' : 'btn-success'}`}
                          onClick={() => handleToggleActive(player)}
                          title={player.isActive ? 'Marquer comme drop' : 'Réactiver'}
                        >
                          {player.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleRemove(player.id)}
                          title="Retirer du tournoi"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tournamentPlayers.filter(p => p.isActive).length >= 2 && (
        <div className="card mt-3">
          <div className="card-header">
            <h3 className="card-title">🚀 Prêt à commencer ?</h3>
          </div>
          <p>
            Vous avez {tournamentPlayers.filter(p => p.isActive).length} participants actifs. 
            Vous pouvez maintenant commencer le tournoi !
          </p>
          <Link 
            to={`/tournament/${tournamentId}`}
            className="btn btn-success"
          >
            🏁 Commencer le Tournoi
          </Link>
        </div>
      )}
    </div>
  );
};

export default PlayerManagement;