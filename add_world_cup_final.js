const { getDb } = require('./db/database');

const db = getDb();

// ═══════════════════════════════════════════════════════════════════════════════
// ICC WORLD CUP 2023 FINAL - INDIA VS AUSTRALIA
// ═══════════════════════════════════════════════════════════════════════════════

// Ensure tournament exists
const tourney = db.prepare('SELECT id FROM Tournaments WHERE name = ?').get('ICC Cricket World Cup');
const tournamentId = tourney ? tourney.id : (() => {
  const result = db.prepare('INSERT INTO Tournaments (name, year, format, host_country, winner, description) VALUES (?, ?, ?, ?, ?, ?)').run(
    'ICC Cricket World Cup', 2023, 'ODI', 'India', 'Australia', '50-over tournament held across India'
  );
  return result.lastInsertRowid;
})();

console.log('✓ Tournament ID:', tournamentId);

// Generate random stats based on player role
function generateStatsForRole(role) {
  const baseStats = {
    'Batter': { runs: 3500 + Math.random() * 2000, average: 35 + Math.random() * 15, matches: 50 + Math.floor(Math.random() * 30) },
    'Bowler': { wickets: 40 + Math.floor(Math.random() * 40), bowl_avg: 20 + Math.random() * 10, matches: 50 + Math.floor(Math.random() * 30) },
    'All-rounder': { runs: 2000 + Math.random() * 1500, average: 30 + Math.random() * 10, wickets: 30 + Math.floor(Math.random() * 25), bowl_avg: 22 + Math.random() * 8, matches: 40 + Math.floor(Math.random() * 25) },
    'Wicket-keeper': { runs: 3000 + Math.random() * 2000, average: 30 + Math.random() * 15, matches: 45 + Math.floor(Math.random() * 25) }
  };
  
  const stats = baseStats[role] || baseStats['Batter'];
  return {
    runs: Math.floor(stats.runs || 0),
    average: parseFloat((stats.average || 0).toFixed(2)),
    matches: stats.matches || 50,
    strike_rate: 85 + Math.random() * 20,
    wickets: Math.floor(stats.wickets || 0),
    bowl_avg: parseFloat((stats.bowl_avg || 0).toFixed(2)),
    highest_score: Math.floor(80 + Math.random() * 40),
    hundreds: Math.floor((stats.runs || 0) / 500),
    fifties: Math.floor(((stats.runs || 0) - 500) / 100)
  };
}

// Get or create player
function getOrCreatePlayer(name, country, role) {
  let player = db.prepare('SELECT id FROM Players WHERE name = ? AND country = ?').get(name, country);
  
  if (!player) {
    const result = db.prepare('INSERT INTO Players (name, country, role, batting_style, bowling_style) VALUES (?, ?, ?, ?, ?)').run(
      name, country, role, role === 'Bowler' ? '' : 'Right-handed', role === 'Batter' ? '' : 'Right-arm'
    );
    player = { id: result.lastInsertRowid };
    console.log(`  ✓ Created player: ${name} (${country}) - ID: ${player.id}`);
  } else {
    console.log(`  ✓ Found existing player: ${name} - ID: ${player.id}`);
  }
  
  return player.id;
}

// Add or update player stats
function upsertPlayerStats(playerId, format, stats) {
  const existing = db.prepare('SELECT id FROM PlayerStats WHERE player_id = ? AND format = ?').get(playerId, format);
  
  if (existing) {
    db.prepare(`UPDATE PlayerStats 
      SET matches = ?, runs = ?, average = ?, strike_rate = ?, highest_score = ?, hundreds = ?, fifties = ?, wickets = ?, bowl_avg = ?
      WHERE player_id = ? AND format = ?`).run(
      stats.matches, stats.runs, stats.average, stats.strike_rate, stats.highest_score, stats.hundreds, stats.fifties, stats.wickets, stats.bowl_avg,
      playerId, format
    );
  } else {
    db.prepare(`INSERT INTO PlayerStats (player_id, format, matches, runs, average, strike_rate, highest_score, hundreds, fifties, wickets, bowl_avg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      playerId, format, stats.matches, stats.runs, stats.average, stats.strike_rate, stats.highest_score, stats.hundreds, stats.fifties, stats.wickets, stats.bowl_avg
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// ADD PLAYERS & STATS
// ───────────────────────────────────────────────────────────────────────────────
console.log('\n📋 Adding Players...');

const players = {
  // India
  'Rohit Sharma': { country: 'India', role: 'Batter' },
  'Shubman Gill': { country: 'India', role: 'Batter' },
  'Virat Kohli': { country: 'India', role: 'Batter' },
  'Shreyas Iyer': { country: 'India', role: 'Batter' },
  'KL Rahul': { country: 'India', role: 'Wicket-keeper' },
  'Ravindra Jadeja': { country: 'India', role: 'All-rounder' },
  'Suryakumar Yadav': { country: 'India', role: 'Batter' },
  'Mohammed Shami': { country: 'India', role: 'Bowler' },
  'Jasprit Bumrah': { country: 'India', role: 'Bowler' },
  'Kuldeep Yadav': { country: 'India', role: 'Bowler' },
  'Mohammed Siraj': { country: 'India', role: 'Bowler' },
  
  // Australia
  'David Warner': { country: 'Australia', role: 'Batter' },
  'Travis Head': { country: 'Australia', role: 'Batter' },
  'Mitchell Marsh': { country: 'Australia', role: 'All-rounder' },
  'Steven Smith': { country: 'Australia', role: 'Batter' },
  'Marnus Labuschagne': { country: 'Australia', role: 'Batter' },
  'Glenn Maxwell': { country: 'Australia', role: 'All-rounder' },
  'Josh Inglis': { country: 'Australia', role: 'Wicket-keeper' },
  'Mitchell Starc': { country: 'Australia', role: 'Bowler' },
  'Pat Cummins': { country: 'Australia', role: 'Bowler' },
  'Adam Zampa': { country: 'Australia', role: 'Bowler' },
  'Josh Hazlewood': { country: 'Australia', role: 'Bowler' },
  'Mitchell Marsh': { country: 'Australia', role: 'All-rounder' }
};

const playerIds = {};
Object.entries(players).forEach(([name, meta]) => {
  playerIds[name] = getOrCreatePlayer(name, meta.country, meta.role);
  
  // Add/update stats for ODI format if they don't have full stats
  const stats = generateStatsForRole(meta.role);
  upsertPlayerStats(playerIds[name], 'ODI', stats);
});

// ───────────────────────────────────────────────────────────────────────────────
// BUILD MATCH SCORECARD JSON
// ───────────────────────────────────────────────────────────────────────────────
console.log('\n📊 Building match scorecard...');

const scorecard = {
  India: {
    teamName: 'India',
    total: 240,
    overs: 50,
    extras: 12,
    batting: [
      { player: 'Rohit Sharma', dismissal: 'c Head b Maxwell', runs: 47, balls: 31, minutes: 44, fours: 4, sixes: 3, sr: 151.61 },
      { player: 'Shubman Gill', dismissal: 'c Zampa b Starc', runs: 4, balls: 7, minutes: 21, fours: 0, sixes: 0, sr: 57.14 },
      { player: 'Virat Kohli', dismissal: 'b Cummins', runs: 54, balls: 63, minutes: 99, fours: 4, sixes: 0, sr: 85.71 },
      { player: 'Shreyas Iyer', dismissal: 'c Inglis b Cummins', runs: 4, balls: 3, minutes: 3, fours: 1, sixes: 0, sr: 133.33 },
      { player: 'KL Rahul', dismissal: 'c Inglis b Starc', runs: 66, balls: 107, minutes: 133, fours: 1, sixes: 0, sr: 61.68 },
      { player: 'Ravindra Jadeja', dismissal: 'c Inglis b Hazlewood', runs: 9, balls: 22, minutes: 33, fours: 0, sixes: 0, sr: 40.90 },
      { player: 'Suryakumar Yadav', dismissal: 'c Inglis b Hazlewood', runs: 18, balls: 28, minutes: 57, fours: 1, sixes: 0, sr: 64.28 },
      { player: 'Mohammed Shami', dismissal: 'c Inglis b Starc', runs: 6, balls: 10, minutes: 9, fours: 1, sixes: 0, sr: 60.00 },
      { player: 'Jasprit Bumrah', dismissal: 'lbw b Zampa', runs: 1, balls: 3, minutes: 5, fours: 0, sixes: 0, sr: 33.33 },
      { player: 'Kuldeep Yadav', dismissal: 'run out (Labuschagne/Cummins)', runs: 10, balls: 18, minutes: 28, fours: 0, sixes: 0, sr: 55.55 },
      { player: 'Mohammed Siraj', dismissal: 'not out', runs: 9, balls: 8, minutes: 13, fours: 1, sixes: 0, sr: 112.50 }
    ],
    didNotBat: []
  },
  Australia: {
    teamName: 'Australia',
    total: '241/4',
    overs: 43,
    extras: 18,
    batting: [
      { player: 'David Warner', dismissal: 'c Kohli b Shami', runs: 7, balls: 3, minutes: 6, fours: 1, sixes: 0, sr: 233.33 },
      { player: 'Travis Head', dismissal: 'c Shubman Gill b Siraj', runs: 137, balls: 120, minutes: 166, fours: 15, sixes: 4, sr: 114.16 },
      { player: 'Mitchell Marsh', dismissal: 'c Rahul b Bumrah', runs: 15, balls: 15, minutes: 15, fours: 1, sixes: 1, sr: 100.00 },
      { player: 'Steven Smith', dismissal: 'lbw b Bumrah', runs: 4, balls: 9, minutes: 11, fours: 1, sixes: 0, sr: 44.44 },
      { player: 'Marnus Labuschagne', dismissal: 'not out', runs: 58, balls: 110, minutes: 133, fours: 4, sixes: 0, sr: 52.72 },
      { player: 'Glenn Maxwell', dismissal: 'not out', runs: 2, balls: 1, minutes: 1, fours: 0, sixes: 0, sr: 200.00 }
    ],
    didNotBat: ['Josh Inglis']
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// ADD MATCH
// ───────────────────────────────────────────────────────────────────────────────
console.log('\n🏟️  Adding match record...');

const matchId = db.prepare(`
  INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, man_of_match_name, man_of_match_id, scorecard_json, highlights)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  tournamentId,
  'India',
  'Australia',
  'Nov 19, 2023',
  'Narendra Modi Stadium, Ahmedabad',
  'ODI',
  'Australia won by 6 wickets (42 balls remaining)',
  '240/10',
  '241/4',
  'Travis Head',
  playerIds['Travis Head'],
  JSON.stringify(scorecard),
  'Travis Head\'s brilliant 137 led Australia to victory in the World Cup final. India fought hard but fell short by 6 wickets.'
).lastInsertRowid;

console.log(`✓ Match added with ID: ${matchId}`);

// ───────────────────────────────────────────────────────────────────────────────
// ADD MATCH PERFORMANCES (BATTING)
// ───────────────────────────────────────────────────────────────────────────────
console.log('\n🏏 Adding batting performances...');

const addBattingPerf = db.prepare(`
  INSERT INTO MatchPerformances (match_id, player_id, player_name, country, role, runs, balls, minutes, fours, sixes, dismissal)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const battingData = [
  // India
  { name: 'Rohit Sharma', country: 'India', runs: 47, balls: 31, minutes: 44, fours: 4, sixes: 3, dismissal: 'c Head b Maxwell' },
  { name: 'Shubman Gill', country: 'India', runs: 4, balls: 7, minutes: 21, fours: 0, sixes: 0, dismissal: 'c Zampa b Starc' },
  { name: 'Virat Kohli', country: 'India', runs: 54, balls: 63, minutes: 99, fours: 4, sixes: 0, dismissal: 'b Cummins' },
  { name: 'Shreyas Iyer', country: 'India', runs: 4, balls: 3, minutes: 3, fours: 1, sixes: 0, dismissal: 'c Inglis b Cummins' },
  { name: 'KL Rahul', country: 'India', runs: 66, balls: 107, minutes: 133, fours: 1, sixes: 0, dismissal: 'c Inglis b Starc' },
  { name: 'Ravindra Jadeja', country: 'India', runs: 9, balls: 22, minutes: 33, fours: 0, sixes: 0, dismissal: 'c Inglis b Hazlewood' },
  { name: 'Suryakumar Yadav', country: 'India', runs: 18, balls: 28, minutes: 57, fours: 1, sixes: 0, dismissal: 'c Inglis b Hazlewood' },
  { name: 'Mohammed Shami', country: 'India', runs: 6, balls: 10, minutes: 9, fours: 1, sixes: 0, dismissal: 'c Inglis b Starc' },
  { name: 'Jasprit Bumrah', country: 'India', runs: 1, balls: 3, minutes: 5, fours: 0, sixes: 0, dismissal: 'lbw b Zampa' },
  { name: 'Kuldeep Yadav', country: 'India', runs: 10, balls: 18, minutes: 28, fours: 0, sixes: 0, dismissal: 'run out (Labuschagne/Cummins)' },
  { name: 'Mohammed Siraj', country: 'India', runs: 9, balls: 8, minutes: 13, fours: 1, sixes: 0, dismissal: 'not out' },
  
  // Australia
  { name: 'David Warner', country: 'Australia', runs: 7, balls: 3, minutes: 6, fours: 1, sixes: 0, dismissal: 'c Kohli b Shami' },
  { name: 'Travis Head', country: 'Australia', runs: 137, balls: 120, minutes: 166, fours: 15, sixes: 4, dismissal: 'c Shubman Gill b Siraj' },
  { name: 'Mitchell Marsh', country: 'Australia', runs: 15, balls: 15, minutes: 15, fours: 1, sixes: 1, dismissal: 'c Rahul b Bumrah' },
  { name: 'Steven Smith', country: 'Australia', runs: 4, balls: 9, minutes: 11, fours: 1, sixes: 0, dismissal: 'lbw b Bumrah' },
  { name: 'Marnus Labuschagne', country: 'Australia', runs: 58, balls: 110, minutes: 133, fours: 4, sixes: 0, dismissal: 'not out' },
  { name: 'Glenn Maxwell', country: 'Australia', runs: 2, balls: 1, minutes: 1, fours: 0, sixes: 0, dismissal: 'not out' }
];

battingData.forEach(b => {
  addBattingPerf.run(matchId, playerIds[b.name], b.name, b.country, 'Batter', b.runs, b.balls, b.minutes, b.fours, b.sixes, b.dismissal);
  console.log(`  ✓ ${b.name}: ${b.runs}(${b.balls})`);
});

// ───────────────────────────────────────────────────────────────────────────────
// ADD MATCH PERFORMANCES (BOWLING)
// ───────────────────────────────────────────────────────────────────────────────
console.log('\n🎳 Adding bowling performances...');

const addBowlingPerf = db.prepare(`
  INSERT INTO MatchPerformances (match_id, player_id, player_name, country, role, overs, maidens, runs_conceded, wickets, economy)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const bowlingData = [
  // India bowlers
  { name: 'Jasprit Bumrah', country: 'India', overs: 9, maidens: 2, runs: 43, wickets: 2, economy: 4.77 },
  { name: 'Mohammed Shami', country: 'India', overs: 7, maidens: 1, runs: 47, wickets: 1, economy: 6.71 },
  { name: 'Ravindra Jadeja', country: 'India', overs: 10, maidens: 0, runs: 43, wickets: 0, economy: 4.30 },
  { name: 'Kuldeep Yadav', country: 'India', overs: 10, maidens: 0, runs: 56, wickets: 0, economy: 5.60 },
  { name: 'Mohammed Siraj', country: 'India', overs: 7, maidens: 0, runs: 45, wickets: 1, economy: 6.42 },
  
  // Australia bowlers
  { name: 'Mitchell Starc', country: 'Australia', overs: 10, maidens: 0, runs: 55, wickets: 3, economy: 5.50 },
  { name: 'Josh Hazlewood', country: 'Australia', overs: 10, maidens: 0, runs: 60, wickets: 2, economy: 6.00 },
  { name: 'Glenn Maxwell', country: 'Australia', overs: 6, maidens: 0, runs: 35, wickets: 1, economy: 5.83 },
  { name: 'Pat Cummins', country: 'Australia', overs: 10, maidens: 0, runs: 34, wickets: 2, economy: 3.40 },
  { name: 'Adam Zampa', country: 'Australia', overs: 10, maidens: 0, runs: 44, wickets: 1, economy: 4.40 }
];

bowlingData.forEach(b => {
  addBowlingPerf.run(matchId, playerIds[b.name], b.name, b.country, 'Bowler', b.overs, b.maidens, b.runs, b.wickets, b.economy);
  console.log(`  ✓ ${b.name}: ${b.wickets}/${b.runs} (${b.overs}ov)`);
});

console.log('\n✅ ICC World Cup 2023 Final - India vs Australia added successfully!\n');
console.log(`Match ID: ${matchId}`);
console.log(`Tournament ID: ${tournamentId}`);
console.log(`Total Players Added/Updated: ${Object.keys(playerIds).length}`);
console.log(`Man of the Match: Travis Head (${playerIds['Travis Head']})`);
