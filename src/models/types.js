// Types et modèles pour l'application de tournoi Flesh and Blood

export const HERO_CLASSES = {
  BRUTE: 'Brute',
  GUARDIAN: 'Guardian', 
  NINJA: 'Ninja',
  RANGER: 'Ranger',
  RUNEBLADE: 'Runeblade',
  WARRIOR: 'Warrior',
  WIZARD: 'Wizard',
  MECHANOLOGIST: 'Mechanologist',
  GENERIC: 'Generic',
  LIGHT_WARRIOR: 'Light Warrior',
  SHADOW_BRUTE: 'Shadow Brute',
  ELEMENTAL_RANGER: 'Elemental Ranger',
  DRACONIC_ILLUSIONIST: 'Draconic Illusionist',
  EARTH_GUARDIAN: 'Earth Guardian'
};

export const HEROES = {
  // Brute
  'Rhinar': HERO_CLASSES.BRUTE,
  'Kayo': HERO_CLASSES.BRUTE,
  'Barraging Beatdown': HERO_CLASSES.BRUTE,
  
  // Guardian
  'Bravo': HERO_CLASSES.GUARDIAN,
  'Valda Brightaxe': HERO_CLASSES.GUARDIAN,
  'Terra': HERO_CLASSES.EARTH_GUARDIAN,
  
  // Ninja
  'Katsu': HERO_CLASSES.NINJA,
  'Benji': HERO_CLASSES.NINJA,
  
  // Ranger
  'Azalea': HERO_CLASSES.RANGER,
  'Lexi': HERO_CLASSES.ELEMENTAL_RANGER,
  
  // Runeblade
  'Viserai': HERO_CLASSES.RUNEBLADE,
  'Chane': HERO_CLASSES.RUNEBLADE,
  
  // Warrior
  'Dorinthea': HERO_CLASSES.WARRIOR,
  'Boltyn': HERO_CLASSES.LIGHT_WARRIOR,
  'Kassai': HERO_CLASSES.WARRIOR,
  
  // Wizard
  'Kano': HERO_CLASSES.WIZARD,
  'Iyslander': HERO_CLASSES.WIZARD,
  
  // Mechanologist
  'Dash': HERO_CLASSES.MECHANOLOGIST,
  'Data Doll MKII': HERO_CLASSES.MECHANOLOGIST,
  
  // Illusionist
  'Prism': HERO_CLASSES.DRACONIC_ILLUSIONIST,
  'Dromai': HERO_CLASSES.DRACONIC_ILLUSIONIST,
  
  // Generic
  'Shiyana': HERO_CLASSES.GENERIC
};

export const TOURNAMENT_STATUS = {
  SETUP: 'setup',
  SWISS_ROUNDS: 'swiss_rounds',
  TOP_CUT: 'top_cut',
  FINISHED: 'finished'
};

export const MATCH_RESULT = {
  PLAYER1_WIN: 'player1_win',
  PLAYER2_WIN: 'player2_win',
  DRAW: 'draw',
  PENDING: 'pending'
};

export const ROUND_TYPE = {
  SWISS: 'swiss',
  ELIMINATION: 'elimination'
};

// Fonction utilitaire pour créer un nouveau joueur
export const createPlayer = (name, hero = null) => ({
  id: crypto.randomUUID(),
  name: name.trim(),
  hero: hero,
  isActive: true,
  wins: 0,
  losses: 0,
  draws: 0,
  points: 0,
  tiebreakers: {
    opponentMatchWinPercentage: 0,
    gameWinPercentage: 0,
    opponentGameWinPercentage: 0
  }
});

// Fonction utilitaire pour créer un nouveau match
export const createMatch = (player1Id, player2Id, roundNumber, table = null) => ({
  id: crypto.randomUUID(),
  player1Id,
  player2Id,
  roundNumber,
  table,
  result: MATCH_RESULT.PENDING,
  player1Games: 0,
  player2Games: 0,
  isActive: true
});

// Fonction utilitaire pour créer un nouveau tournoi
export const createTournament = (name) => ({
  id: crypto.randomUUID(),
  name: name.trim(),
  status: TOURNAMENT_STATUS.SETUP,
  players: [],
  rounds: [],
  currentRound: 0,
  topCutSize: 8,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Fonction utilitaire pour créer un nouveau round
export const createRound = (roundNumber, type = ROUND_TYPE.SWISS) => ({
  id: crypto.randomUUID(),
  roundNumber,
  type,
  matches: [],
  isComplete: false,
  createdAt: new Date().toISOString()
});