const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'cricket.db'));

const tId = 1; // ICC Cricket World Cup (2023)

db.transaction(() => {
  // 1. Wipe everything for this tournament to get rid of duplicates
  db.prepare("DELETE FROM PointsTable WHERE tournament_id=?").run(tId);
  db.prepare("DELETE FROM TournamentStats WHERE tournament_id=?").run(tId);

  // 2. Insert Points Table
  const pointsData = [
    { team: 'IND', p: 9, w: 9, l: 0, pts: 18, nrr: 2.570 },
    { team: 'SA', p: 9, w: 7, l: 2, pts: 14, nrr: 1.261 },
    { team: 'AUS', p: 9, w: 7, l: 2, pts: 14, nrr: 0.841 },
    { team: 'NZ', p: 9, w: 5, l: 4, pts: 10, nrr: 0.743 },
    { team: 'PAK', p: 9, w: 4, l: 5, pts: 8, nrr: -0.199 },
    { team: 'AFG', p: 9, w: 4, l: 5, pts: 8, nrr: -0.336 },
    { team: 'ENG', p: 9, w: 3, l: 6, pts: 6, nrr: -0.572 },
    { team: 'BAN', p: 9, w: 2, l: 7, pts: 4, nrr: -1.087 },
    { team: 'SL', p: 9, w: 2, l: 7, pts: 4, nrr: -1.419 },
    { team: 'NED', p: 9, w: 2, l: 7, pts: 4, nrr: -1.825 }
  ];

  const insertPoints = db.prepare("INSERT INTO PointsTable (tournament_id, team, played, won, lost, points, nrr) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const row of pointsData) {
    insertPoints.run(tId, row.team, row.p, row.w, row.l, row.pts, row.nrr);
  }

  // 3. Insert Top Wicket Takers
  const wicketTakers = [
    { name: 'Mohammed Shami', country: 'IND', wickets: 24, innings: 7, average: 10.70 },
    { name: 'Adam Zampa', country: 'AUS', wickets: 23, innings: 11, average: 22.39 },
    { name: 'Dilshan Madushanka', country: 'SL', wickets: 21, innings: 9, average: 25.00 }
  ];

  const getPlayer = db.prepare("SELECT id FROM Players WHERE name = ?");
  const insertTournStat = db.prepare("INSERT INTO TournamentStats (tournament_id, player_id, stat_type, value, innings, average) VALUES (?, ?, ?, ?, ?, ?)");

  for (const w of wicketTakers) {
    const p = getPlayer.get(w.name);
    if (p) {
      insertTournStat.run(tId, p.id, 'wickets', w.wickets, w.innings, w.average);
    }
  }

  // 4. Insert Top Run Scorers
  const runScorers = [
    { name: 'Virat Kohli', country: 'IND', runs: 765, innings: 11, average: 95.62 },
    { name: 'Rohit Sharma', country: 'IND', runs: 597, innings: 11, average: 54.27 },
    { name: 'Quinton de Kock', country: 'SA', runs: 594, innings: 10, average: 59.40 }
  ];

  for (const r of runScorers) {
    const p = getPlayer.get(r.name);
    if (p) {
      insertTournStat.run(tId, p.id, 'runs', r.runs, r.innings, r.average);
    }
  }
})();

console.log("Database cleaned and tournament stats updated successfully!");
