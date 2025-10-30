import { createMatch, MATCH_RESULT } from '../models/types.js';

/**
 * Service pour gérer les pairings de tournois suisses
 */
export class PairingService {
  
  /**
   * Génère les pairings pour un round suisse
   * @param {Array} players - Liste des joueurs actifs
   * @param {Array} previousMatches - Matches des rounds précédents
   * @param {number} roundNumber - Numéro du round à générer
   * @returns {Array} Liste des matches pour ce round
   */
  static generateSwissPairings(players, previousMatches, roundNumber) {
    if (players.length < 2) {
      throw new Error('Au moins 2 joueurs sont nécessaires pour créer des pairings');
    }

    // Calculer les standings actuels
    const standings = this.calculateStandings(players, previousMatches);
    
    // Grouper par points
    const pointGroups = this.groupByPoints(standings);
    
    // Générer les pairings en évitant les rematches
    const pairings = [];
    const pairedPlayers = new Set();
    
    // Pour chaque groupe de points (du plus haut au plus bas)
    const sortedPointGroups = Object.keys(pointGroups)
      .map(Number)
      .sort((a, b) => b - a);

    for (const points of sortedPointGroups) {
      const group = pointGroups[points].filter(player => !pairedPlayers.has(player.id));
      
      if (group.length === 0) continue;
      
      // Si un nombre impair de joueurs dans le groupe, essayer de pair down
      if (group.length % 2 === 1) {
        const pairDownPlayer = group.pop();
        
        // Essayer de trouver un joueur dans un groupe de points inférieur
        const lowerPointsPlayer = this.findPairDownOpponent(
          pairDownPlayer, 
          pointGroups, 
          points, 
          pairedPlayers, 
          previousMatches
        );
        
        if (lowerPointsPlayer) {
          pairings.push(createMatch(pairDownPlayer.id, lowerPointsPlayer.id, roundNumber));
          pairedPlayers.add(pairDownPlayer.id);
          pairedPlayers.add(lowerPointsPlayer.id);
        } else {
          // Remettre le joueur dans le groupe si pas de pair down possible
          group.push(pairDownPlayer);
        }
      }
      
      // Pairer les joueurs restants dans le groupe
      const groupPairings = this.pairPlayersInGroup(group, previousMatches, roundNumber);
      pairings.push(...groupPairings);
      
      groupPairings.forEach(match => {
        pairedPlayers.add(match.player1Id);
        pairedPlayers.add(match.player2Id);
      });
    }
    
    // Gérer les joueurs restants (bye ou problèmes de pairing)
    const unpairedPlayers = players.filter(player => !pairedPlayers.has(player.id));
    if (unpairedPlayers.length === 1) {
      // Donner un bye au joueur restant
      pairings.push(this.createByeMatch(unpairedPlayers[0], roundNumber));
    } else if (unpairedPlayers.length > 1) {
      // Forcer des pairings même s'ils ne sont pas optimaux
      const forcedPairings = this.forcePairings(unpairedPlayers, roundNumber);
      pairings.push(...forcedPairings);
    }
    
    return pairings;
  }

  /**
   * Calcule les standings actuels des joueurs
   */
  static calculateStandings(players, matches) {
    const standings = players.map(player => ({
      ...player,
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      opponents: []
    }));

    const playerMap = new Map(standings.map(p => [p.id, p]));

    // Calculer les statistiques basées sur les matches
    matches.forEach(match => {
      if (match.result === MATCH_RESULT.PENDING) return;

      const player1 = playerMap.get(match.player1Id);
      const player2 = playerMap.get(match.player2Id);

      if (!player1 || !player2) return;

      // Ajouter l'adversaire à la liste
      player1.opponents.push(match.player2Id);
      player2.opponents.push(match.player1Id);

      // Calculer les points
      if (match.result === MATCH_RESULT.PLAYER1_WIN) {
        player1.wins++;
        player1.points += 3;
        player2.losses++;
      } else if (match.result === MATCH_RESULT.PLAYER2_WIN) {
        player2.wins++;
        player2.points += 3;
        player1.losses++;
      } else if (match.result === MATCH_RESULT.DRAW) {
        player1.draws++;
        player1.points += 1;
        player2.draws++;
        player2.points += 1;
      }
    });

    return standings.sort((a, b) => b.points - a.points || b.wins - a.wins);
  }

  /**
   * Groupe les joueurs par points
   */
  static groupByPoints(standings) {
    const groups = {};
    standings.forEach(player => {
      if (!groups[player.points]) {
        groups[player.points] = [];
      }
      groups[player.points].push(player);
    });
    return groups;
  }

  /**
   * Trouve un adversaire pour un pair down
   */
  static findPairDownOpponent(player, pointGroups, currentPoints, pairedPlayers, previousMatches) {
    const sortedPoints = Object.keys(pointGroups)
      .map(Number)
      .filter(p => p < currentPoints)
      .sort((a, b) => b - a);

    for (const points of sortedPoints) {
      const candidates = pointGroups[points].filter(candidate => 
        !pairedPlayers.has(candidate.id) && 
        !this.havePlayedBefore(player, candidate, previousMatches)
      );

      if (candidates.length > 0) {
        // Retirer le joueur du groupe
        const opponent = candidates[0];
        const index = pointGroups[points].indexOf(opponent);
        pointGroups[points].splice(index, 1);
        return opponent;
      }
    }

    return null;
  }

  /**
   * Vérifie si deux joueurs ont déjà joué l'un contre l'autre
   */
  static havePlayedBefore(player1, player2, previousMatches) {
    return previousMatches.some(match => 
      (match.player1Id === player1.id && match.player2Id === player2.id) ||
      (match.player1Id === player2.id && match.player2Id === player1.id)
    );
  }

  /**
   * Pairie les joueurs dans un groupe de points
   */
  static pairPlayersInGroup(players, previousMatches, roundNumber) {
    const pairings = [];
    const remaining = [...players];

    while (remaining.length >= 2) {
      const player1 = remaining.shift();
      
      // Trouver le meilleur adversaire pour player1
      let bestOpponentIndex = -1;
      for (let i = 0; i < remaining.length; i++) {
        if (!this.havePlayedBefore(player1, remaining[i], previousMatches)) {
          bestOpponentIndex = i;
          break;
        }
      }

      // Si aucun adversaire non rencontré, prendre le premier disponible
      if (bestOpponentIndex === -1 && remaining.length > 0) {
        bestOpponentIndex = 0;
      }

      if (bestOpponentIndex >= 0) {
        const player2 = remaining.splice(bestOpponentIndex, 1)[0];
        pairings.push(createMatch(player1.id, player2.id, roundNumber));
      }
    }

    return pairings;
  }

  /**
   * Crée un match bye pour un joueur
   */
  static createByeMatch(player, roundNumber) {
    return {
      ...createMatch(player.id, null, roundNumber),
      result: MATCH_RESULT.PLAYER1_WIN,
      isBye: true
    };
  }

  /**
   * Force des pairings pour les joueurs restants
   */
  static forcePairings(players, roundNumber) {
    const pairings = [];
    const remaining = [...players];

    while (remaining.length >= 2) {
      const player1 = remaining.pop();
      const player2 = remaining.pop();
      pairings.push(createMatch(player1.id, player2.id, roundNumber));
    }

    // S'il reste un joueur, lui donner un bye
    if (remaining.length === 1) {
      pairings.push(this.createByeMatch(remaining[0], roundNumber));
    }

    return pairings;
  }

  /**
   * Valide si un pairing manuel est acceptable
   */
  static validateManualPairing(player1Id, player2Id, previousMatches) {
    if (player1Id === player2Id) {
      return { valid: false, reason: 'Un joueur ne peut pas jouer contre lui-même' };
    }

    const hasPlayed = previousMatches.some(match => 
      (match.player1Id === player1Id && match.player2Id === player2Id) ||
      (match.player1Id === player2Id && match.player2Id === player1Id)
    );

    if (hasPlayed) {
      return { valid: false, reason: 'Ces joueurs ont déjà joué l\'un contre l\'autre' };
    }

    return { valid: true };
  }

  /**
   * Modifie un pairing existant
   */
  static modifyPairing(matches, oldMatchId, newPlayer1Id, newPlayer2Id) {
    const matchIndex = matches.findIndex(m => m.id === oldMatchId);
    if (matchIndex === -1) {
      throw new Error('Match introuvable');
    }

    const oldMatch = matches[matchIndex];
    
    // Créer le nouveau match
    const newMatch = {
      ...oldMatch,
      player1Id: newPlayer1Id,
      player2Id: newPlayer2Id,
      result: MATCH_RESULT.PENDING,
      player1Games: 0,
      player2Games: 0
    };

    // Remplacer le match
    matches[matchIndex] = newMatch;
    
    return matches;
  }
}