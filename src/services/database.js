import Dexie from 'dexie';

// Configuration de la base de données IndexedDB
class TournamentDB extends Dexie {
  constructor() {
    super('FABTournamentDB');
    
    this.version(1).stores({
      tournaments: '++id, name, status, createdAt, updatedAt',
      players: '++id, name, isActive, createdAt, updatedAt', // Joueurs globaux
      tournamentPlayers: '++id, tournamentId, playerId, hero, wins, losses, draws, points', // Association tournoi-joueur
      rounds: '++id, tournamentId, roundNumber, type, isComplete, createdAt',
      matches: '++id, tournamentId, roundId, player1Id, player2Id, roundNumber, table, result, player1Games, player2Games, isActive'
    });
  }
}

// Instance de la base de données
export const db = new TournamentDB();

// Service pour gérer les tournois
export class TournamentService {
  
  // Créer un nouveau tournoi
  static async createTournament(tournamentData) {
    try {
      const id = await db.tournaments.add(tournamentData);
      return await db.tournaments.get(id);
    } catch (error) {
      console.error('Erreur lors de la création du tournoi:', error);
      throw error;
    }
  }

  // Récupérer tous les tournois
  static async getAllTournaments() {
    try {
      return await db.tournaments.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des tournois:', error);
      throw error;
    }
  }

  // Récupérer un tournoi par ID
  static async getTournament(id) {
    try {
      return await db.tournaments.get(id);
    } catch (error) {
      console.error('Erreur lors de la récupération du tournoi:', error);
      throw error;
    }
  }

  // Mettre à jour un tournoi
  static async updateTournament(id, updates) {
    try {
      await db.tournaments.update(id, { ...updates, updatedAt: new Date().toISOString() });
      return await db.tournaments.get(id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tournoi:', error);
      throw error;
    }
  }

  // Supprimer un tournoi et toutes ses données associées
  static async deleteTournament(id) {
    try {
      await db.transaction('rw', db.tournaments, db.tournamentPlayers, db.rounds, db.matches, async () => {
        await db.tournaments.delete(id);
        await db.tournamentPlayers.where('tournamentId').equals(id).delete();
        await db.rounds.where('tournamentId').equals(id).delete();
        await db.matches.where('tournamentId').equals(id).delete();
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du tournoi:', error);
      throw error;
    }
  }

  // Récupérer les données complètes d'un tournoi
  static async getTournamentData(tournamentId) {
    try {
      const [tournament, tournamentPlayers, rounds, matches] = await Promise.all([
        db.tournaments.get(tournamentId),
        db.tournamentPlayers.where('tournamentId').equals(tournamentId).toArray(),
        db.rounds.where('tournamentId').equals(tournamentId).toArray(),
        db.matches.where('tournamentId').equals(tournamentId).toArray()
      ]);

      // Récupérer les informations complètes des joueurs
      const playerIds = tournamentPlayers.map(tp => tp.playerId);
      const players = await db.players.where('id').anyOf(playerIds).toArray();
      
      // Fusionner les données des joueurs avec leurs stats de tournoi
      const playersWithTournamentData = tournamentPlayers.map(tp => {
        const player = players.find(p => p.id === tp.playerId);
        return {
          ...player,
          ...tp,
          id: tp.playerId // Garder l'ID du joueur pour compatibilité
        };
      });

      return {
        tournament,
        players: playersWithTournamentData,
        rounds,
        matches
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données du tournoi:', error);
      throw error;
    }
  }
}

// Service pour gérer les joueurs globaux
export class PlayerService {
  
  // Créer un nouveau joueur global
  static async createPlayer(playerData) {
    try {
      const player = { 
        ...playerData, 
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const id = await db.players.add(player);
      return await db.players.get(id);
    } catch (error) {
      console.error('Erreur lors de la création du joueur:', error);
      throw error;
    }
  }

  // Récupérer tous les joueurs globaux
  static async getAllPlayers() {
    try {
      return await db.players.orderBy('name').toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des joueurs:', error);
      throw error;
    }
  }

  // Mettre à jour un joueur global
  static async updatePlayer(id, updates) {
    try {
      await db.players.update(id, { ...updates, updatedAt: new Date().toISOString() });
      return await db.players.get(id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du joueur:', error);
      throw error;
    }
  }

  // Supprimer un joueur global
  static async deletePlayer(id) {
    try {
      await db.players.delete(id);
    } catch (error) {
      console.error('Erreur lors de la suppression du joueur:', error);
      throw error;
    }
  }
}

// Service pour gérer la participation des joueurs aux tournois
export class TournamentPlayerService {
  
  // Ajouter un joueur à un tournoi
  static async addPlayerToTournament(tournamentId, playerId, hero = null) {
    try {
      const existingEntry = await db.tournamentPlayers
        .where('tournamentId').equals(tournamentId)
        .and(tp => tp.playerId === playerId)
        .first();
      
      if (existingEntry) {
        throw new Error('Ce joueur est déjà inscrit à ce tournoi');
      }

      const tournamentPlayer = {
        tournamentId,
        playerId,
        hero,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        isActive: true
      };
      
      const id = await db.tournamentPlayers.add(tournamentPlayer);
      return await db.tournamentPlayers.get(id);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du joueur au tournoi:', error);
      throw error;
    }
  }

  // Récupérer tous les joueurs d'un tournoi avec leurs informations complètes
  static async getTournamentPlayers(tournamentId) {
    try {
      const tournamentPlayers = await db.tournamentPlayers
        .where('tournamentId').equals(tournamentId).toArray();
      
      const playerIds = tournamentPlayers.map(tp => tp.playerId);
      const players = await db.players.where('id').anyOf(playerIds).toArray();
      
      return tournamentPlayers.map(tp => {
        const player = players.find(p => p.id === tp.playerId);
        return {
          ...player,
          ...tp,
          id: tp.playerId // Garder l'ID du joueur pour compatibilité
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des joueurs du tournoi:', error);
      throw error;
    }
  }

  // Mettre à jour les données d'un joueur dans un tournoi
  static async updateTournamentPlayer(tournamentId, playerId, updates) {
    try {
      const tournamentPlayer = await db.tournamentPlayers
        .where('tournamentId').equals(tournamentId)
        .and(tp => tp.playerId === playerId)
        .first();
      
      if (!tournamentPlayer) {
        throw new Error('Joueur non trouvé dans ce tournoi');
      }

      await db.tournamentPlayers.update(tournamentPlayer.id, updates);
      return await this.getTournamentPlayers(tournamentId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du joueur du tournoi:', error);
      throw error;
    }
  }

  // Retirer un joueur d'un tournoi
  static async removePlayerFromTournament(tournamentId, playerId) {
    try {
      await db.tournamentPlayers
        .where('tournamentId').equals(tournamentId)
        .and(tp => tp.playerId === playerId)
        .delete();
    } catch (error) {
      console.error('Erreur lors du retrait du joueur du tournoi:', error);
      throw error;
    }
  }

  // Récupérer les joueurs actifs d'un tournoi
  static async getActiveTournamentPlayers(tournamentId) {
    try {
      const allPlayers = await this.getTournamentPlayers(tournamentId);
      return allPlayers.filter(player => player.isActive);
    } catch (error) {
      console.error('Erreur lors de la récupération des joueurs actifs:', error);
      throw error;
    }
  }
}

// Service pour gérer les rounds
export class RoundService {
  
  // Créer un nouveau round
  static async createRound(tournamentId, roundData) {
    try {
      const round = { ...roundData, tournamentId };
      const id = await db.rounds.add(round);
      return await db.rounds.get(id);
    } catch (error) {
      console.error('Erreur lors de la création du round:', error);
      throw error;
    }
  }

  // Récupérer tous les rounds d'un tournoi
  static async getRounds(tournamentId) {
    try {
      return await db.rounds.where('tournamentId').equals(tournamentId)
        .orderBy('roundNumber').toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des rounds:', error);
      throw error;
    }
  }

  // Mettre à jour un round
  static async updateRound(id, updates) {
    try {
      await db.rounds.update(id, updates);
      return await db.rounds.get(id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du round:', error);
      throw error;
    }
  }
}

// Service pour gérer les matches
export class MatchService {
  
  // Créer un nouveau match
  static async createMatch(tournamentId, roundId, matchData) {
    try {
      const match = { ...matchData, tournamentId, roundId };
      const id = await db.matches.add(match);
      return await db.matches.get(id);
    } catch (error) {
      console.error('Erreur lors de la création du match:', error);
      throw error;
    }
  }

  // Récupérer tous les matches d'un round
  static async getMatchesForRound(tournamentId, roundNumber) {
    try {
      return await db.matches.where('tournamentId').equals(tournamentId)
        .and(match => match.roundNumber === roundNumber).toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des matches:', error);
      throw error;
    }
  }

  // Mettre à jour un match
  static async updateMatch(id, updates) {
    try {
      await db.matches.update(id, updates);
      return await db.matches.get(id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du match:', error);
      throw error;
    }
  }

  // Récupérer tous les matches d'un tournoi
  static async getMatches(tournamentId) {
    try {
      return await db.matches.where('tournamentId').equals(tournamentId).toArray();
    } catch (error) {
      console.error('Erreur lors de la récupération des matches:', error);
      throw error;
    }
  }
}

// Service pour l'export/import des données
export class DataService {
  
  // Exporter les données d'un tournoi
  static async exportTournament(tournamentId) {
    try {
      const data = await TournamentService.getTournamentData(tournamentId);
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournament_${data.tournament.name}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return exportData;
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      throw error;
    }
  }

  // Importer les données d'un tournoi
  static async importTournament(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.version || !data.tournament) {
        throw new Error('Format de fichier invalide');
      }

      // Créer le tournoi
      const { id: originalId, ...tournamentData } = data.tournament;
      const tournament = await TournamentService.createTournament(tournamentData);
      
      // Créer les joueurs
      const playerMapping = {};
      for (const player of data.players) {
        const { id: originalPlayerId, tournamentId, ...playerData } = player;
        const newPlayer = await PlayerService.addPlayer(tournament.id, playerData);
        playerMapping[originalPlayerId] = newPlayer.id;
      }

      // Créer les rounds et matches
      for (const round of data.rounds) {
        const { id: originalRoundId, tournamentId, ...roundData } = round;
        const newRound = await RoundService.createRound(tournament.id, roundData);
        
        // Créer les matches pour ce round
        const roundMatches = data.matches.filter(m => m.roundNumber === round.roundNumber);
        for (const match of roundMatches) {
          const { id: originalMatchId, tournamentId, roundId, player1Id, player2Id, ...matchData } = match;
          await MatchService.createMatch(tournament.id, newRound.id, {
            ...matchData,
            player1Id: playerMapping[player1Id],
            player2Id: playerMapping[player2Id]
          });
        }
      }

      return tournament;
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      throw error;
    }
  }
}