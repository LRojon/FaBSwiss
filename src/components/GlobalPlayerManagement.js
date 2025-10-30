import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayerService } from '../services/database';

const GlobalPlayerManagement = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const playersData = await PlayerService.getAllPlayers();
        setPlayers(playersData);
      } catch (err) {
        setError('Erreur lors du chargement: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadPlayers();
  }, []);

  const reloadPlayers = async () => {
    try {
      const playersData = await PlayerService.getAllPlayers();
      setPlayers(playersData);
    } catch (err) {
      setError('Erreur lors du rechargement: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingPlayer) {
        await PlayerService.updatePlayer(editingPlayer.id, formData);
      } else {
        await PlayerService.createPlayer(formData);
      }
      
      resetForm();
      await reloadPlayers();
    } catch (err) {
      setError('Erreur lors de la sauvegarde: ' + err.message);
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name
    });
    setShowAddForm(true);
  };

  const handleDelete = async (playerId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce joueur ? Cette action est irréversible.')) {
      return;
    }

    try {
      await PlayerService.deletePlayer(playerId);
      await reloadPlayers();
    } catch (err) {
      setError('Erreur lors de la suppression: ' + err.message);
    }
  };

  const handleToggleActive = async (player) => {
    try {
      await PlayerService.updatePlayer(player.id, {
        isActive: !player.isActive
      });
      await reloadPlayers();
    } catch (err) {
      setError('Erreur lors de la mise à jour: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingPlayer(null);
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="loading">Chargement des joueurs...</div>;
  }

  return (
    <div>
      <div className="flex-between mb-3">
        <div>
          <h2>Gestion des Joueurs</h2>
          <p className="text-secondary">Gérez votre base de données de joueurs FAB</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            ✨ Nouveau Joueur
          </button>
          <Link to="/" className="btn btn-secondary">
            🏠 Accueil
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

      {showAddForm && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">
              {editingPlayer ? '✏️ Modifier le joueur' : '➕ Ajouter un joueur'}
            </h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="playerName">Nom du joueur</label>
                <input
                  type="text"
                  id="playerName"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du joueur"
                  required
                />
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
            👥 Base de données des joueurs ({players.filter(p => p.isActive).length} actifs / {players.length} total)
          </h3>
        </div>

        {players.length === 0 ? (
          <div className="text-center">
            <p>🎭 Aucun joueur enregistré pour l'instant.</p>
            <p>Ajoutez vos premiers joueurs pour constituer votre base de données !</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>👤 Nom</th>
                  <th>📅 Créé le</th>
                  <th>🔄 Modifié le</th>
                  <th>🔘 Statut</th>
                  <th>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id} className={!player.isActive ? 'text-muted' : ''}>
                    <td>
                      <strong>{player.name}</strong>
                    </td>
                    <td>
                      {new Date(player.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      {new Date(player.updatedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <span className={`status-badge ${player.isActive ? 'status-complete' : 'status-pending'}`}>
                        {player.isActive ? '✅ Actif' : '⏸️ Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-warning btn-small"
                          onClick={() => handleEdit(player)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className={`btn btn-small ${player.isActive ? 'btn-secondary' : 'btn-success'}`}
                          onClick={() => handleToggleActive(player)}
                          title={player.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {player.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDelete(player.id)}
                          title="Supprimer"
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

      <div className="card mt-3">
        <div className="card-header">
          <h3 className="card-title">💡 À propos de la gestion des joueurs</h3>
        </div>
        <div>
          <p>
            Cette base de données centralisée vous permet de gérer tous vos joueurs FAB en un seul endroit.
          </p>
          
          <h4>🎯 Avantages :</h4>
          <ul>
            <li>🗂️ <strong>Centralisation</strong> : Une seule base de données pour tous vos tournois</li>
            <li>⚡ <strong>Rapidité</strong> : Ajout rapide des joueurs aux tournois</li>
            <li>📊 <strong>Historique</strong> : Suivi des joueurs à travers les tournois</li>
            <li>🔄 <strong>Réutilisation</strong> : Pas besoin de ressaisir les noms</li>
          </ul>

          <h4>📝 Comment ça marche :</h4>
          <ol>
            <li>Ajoutez ici tous les joueurs de votre communauté</li>
            <li>Dans un tournoi, sélectionnez les joueurs participants</li>
            <li>Assignez les héros FAB au moment de l'inscription au tournoi</li>
            <li>Les statistiques sont calculées par tournoi</li>
          </ol>

          <p className="text-muted">
            💾 Les données sont sauvegardées localement dans votre navigateur.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalPlayerManagement;