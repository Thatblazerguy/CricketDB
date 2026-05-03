const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'cricket.db'));

try {
  db.exec("ALTER TABLE Matches ADD COLUMN scorecard_json TEXT");
} catch(e) {}

const getPlayer = db.prepare("SELECT id FROM Players WHERE name = ?");
const insertPlayer = db.prepare("INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) VALUES (?, ?, ?, ?, ?, ?)");
const insertStat = db.prepare("INSERT INTO PlayerStats (player_id, format, matches, runs, average, strike_rate, hundreds, fifties, wickets, bowl_avg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

const playersList = [
  { country: 'India', name: 'Rohit Sharma', role: 'Captain/Batsman' },
  { country: 'India', name: 'Shubman Gill', role: 'Batsman' },
  { country: 'India', name: 'Virat Kohli', role: 'Batsman' },
  { country: 'India', name: 'Shreyas Iyer', role: 'Batsman' },
  { country: 'India', name: 'KL Rahul', role: 'Wicketkeeper-Batsman' },
  { country: 'India', name: 'Hardik Pandya', role: 'All-rounder' },
  { country: 'India', name: 'Ravindra Jadeja', role: 'All-rounder' },
  { country: 'India', name: 'Shardul Thakur', role: 'All-rounder' },
  { country: 'India', name: 'Jasprit Bumrah', role: 'Bowler' },
  { country: 'India', name: 'Kuldeep Yadav', role: 'Bowler' },
  { country: 'India', name: 'Mohammed Siraj', role: 'Bowler' },
  { country: 'Pakistan', name: 'Abdullah Shafique', role: 'Batsman' },
  { country: 'Pakistan', name: 'Imam-ul-Haq', role: 'Batsman' },
  { country: 'Pakistan', name: 'Babar Azam', role: 'Captain/Batsman' },
  { country: 'Pakistan', name: 'Mohammad Rizwan', role: 'Wicketkeeper-Batsman' },
  { country: 'Pakistan', name: 'Saud Shakeel', role: 'Batsman' },
  { country: 'Pakistan', name: 'Iftikhar Ahmed', role: 'All-rounder' },
  { country: 'Pakistan', name: 'Shadab Khan', role: 'All-rounder' },
  { country: 'Pakistan', name: 'Mohammad Nawaz', role: 'All-rounder' },
  { country: 'Pakistan', name: 'Hasan Ali', role: 'Bowler' },
  { country: 'Pakistan', name: 'Shaheen Shah Afridi', role: 'Bowler' },
  { country: 'Pakistan', name: 'Haris Rauf', role: 'Bowler' }
];

db.transaction(() => {
  for (const p of playersList) {
    if (!getPlayer.get(p.name)) {
      const jersey = Math.floor(Math.random() * 99) + 1;
      const info = insertPlayer.run(p.name, p.country, p.role, 'Unknown', 'Unknown', jersey);
      // Give them a blank stat row so the frontend doesn't crash
      insertStat.run(info.lastInsertRowid, 'ODI', 1, 0, 0, 0, 0, 0, 0, 0);
    }
  }
})();

const tIdRow = db.prepare("SELECT id FROM Tournaments WHERE name LIKE '%ICC ODI WC 2023%' OR name LIKE '%ICC Cricket World Cup%'").get();
let tId = tIdRow ? tIdRow.id : 1;

const existingMatch = db.prepare("SELECT id FROM Matches WHERE team1='India' AND team2='Pakistan' AND date LIKE '%14-Oct-2023%'").get();

let matchId;
if (existingMatch) {
  matchId = existingMatch.id;
} else {
  const insertMatch = db.prepare(`INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const info = insertMatch.run(tId, 'India', 'Pakistan', '14-Oct-2023', 'Ahmedabad', 'ODI', 'India won by 7 wickets (117 balls remaining)', '192/3', '191', 'Player of the Match: Jasprit Bumrah (2/19)');
  matchId = info.lastInsertRowid;
}

db.prepare("UPDATE Matches SET score_team1=?, score_team2=?, highlights=? WHERE id=?").run('192/3 (30.3 overs)', '191 (42.5 overs)', 'Player of the Match: Jasprit Bumrah (2/19)', matchId);

const scorecardJson = {
  pakistan: {
    teamName: "Pakistan",
    batting: [
      { player: "Abdullah Shafique", dismissal: "lbw b Mohammed Siraj", runs: 20, balls: 24, fours: 3, sixes: 0, sr: 83.33 },
      { player: "Imam-ul-Haq", dismissal: "c Rahul b Pandya", runs: 36, balls: 38, fours: 6, sixes: 0, sr: 94.73 },
      { player: "Babar Azam", dismissal: "b Mohammed Siraj", runs: 50, balls: 58, fours: 7, sixes: 0, sr: 86.20 },
      { player: "Mohammad Rizwan", dismissal: "b Bumrah", runs: 49, balls: 69, fours: 7, sixes: 0, sr: 71.01 },
      { player: "Saud Shakeel", dismissal: "lbw b Kuldeep Yadav", runs: 6, balls: 10, fours: 0, sixes: 0, sr: 60.00 },
      { player: "Iftikhar Ahmed", dismissal: "b Kuldeep Yadav", runs: 4, balls: 4, fours: 1, sixes: 0, sr: 100.00 },
      { player: "Shadab Khan", dismissal: "b Bumrah", runs: 2, balls: 5, fours: 0, sixes: 0, sr: 40.00 },
      { player: "Mohammad Nawaz", dismissal: "c Bumrah b Pandya", runs: 4, balls: 14, fours: 0, sixes: 0, sr: 28.57 },
      { player: "Hasan Ali", dismissal: "c Shubman Gill b Jadeja", runs: 12, balls: 19, fours: 2, sixes: 0, sr: 63.15 },
      { player: "Shaheen Shah Afridi", dismissal: "not out", runs: 2, balls: 10, fours: 0, sixes: 0, sr: 20.00 },
      { player: "Haris Rauf", dismissal: "lbw b Jadeja", runs: 2, balls: 6, fours: 0, sixes: 0, sr: 33.33 }
    ],
    didNotBat: [],
    extras: "4",
    total: "191 all out (42.5 overs)",
    bowling: [
      { player: "Jasprit Bumrah", overs: 7, maidens: 1, runs: 19, wickets: 2, econ: 2.71 },
      { player: "Mohammed Siraj", overs: 8, maidens: 0, runs: 50, wickets: 2, econ: 6.25 },
      { player: "Hardik Pandya", overs: 6, maidens: 0, runs: 34, wickets: 2, econ: 5.66 },
      { player: "Kuldeep Yadav", overs: 10, maidens: 0, runs: 35, wickets: 2, econ: 3.50 },
      { player: "Ravindra Jadeja", overs: 9.5, maidens: 0, runs: 38, wickets: 2, econ: 3.86 },
      { player: "Shardul Thakur", overs: 2, maidens: 0, runs: 12, wickets: 0, econ: 6.00 }
    ],
    fallOfWickets: []
  },
  india: {
    teamName: "India",
    batting: [
      { player: "Rohit Sharma", dismissal: "c Iftikhar Ahmed b Shaheen Afridi", runs: 86, balls: 63, fours: 6, sixes: 6, sr: 136.50 },
      { player: "Shubman Gill", dismissal: "c Shadab Khan b Shaheen Afridi", runs: 16, balls: 11, fours: 4, sixes: 0, sr: 145.45 },
      { player: "Virat Kohli", dismissal: "c Mohammad Nawaz b Hasan Ali", runs: 16, balls: 18, fours: 3, sixes: 0, sr: 88.88 },
      { player: "Shreyas Iyer", dismissal: "not out", runs: 53, balls: 62, fours: 3, sixes: 2, sr: 85.48 },
      { player: "KL Rahul", dismissal: "not out", runs: 19, balls: 29, fours: 2, sixes: 0, sr: 65.51 }
    ],
    didNotBat: ["Hardik Pandya", "Ravindra Jadeja", "Shardul Thakur", "Jasprit Bumrah", "Kuldeep Yadav", "Mohammed Siraj"],
    extras: "2",
    total: "192/3 (30.3 overs)",
    bowling: [
      { player: "Shaheen Shah Afridi", overs: 6, maidens: 0, runs: 36, wickets: 2, econ: 6.00 },
      { player: "Hasan Ali", overs: 6, maidens: 0, runs: 34, wickets: 1, econ: 5.66 },
      { player: "Mohammad Nawaz", overs: 8.3, maidens: 0, runs: 47, wickets: 0, econ: 5.52 },
      { player: "Haris Rauf", overs: 6, maidens: 0, runs: 43, wickets: 0, econ: 7.16 },
      { player: "Shadab Khan", overs: 4, maidens: 0, runs: 31, wickets: 0, econ: 7.75 }
    ],
    fallOfWickets: [
      { wicket: 1, score: 23, player: "Shubman Gill", over: 2.5 },
      { wicket: 2, score: 79, player: "Virat Kohli", over: 9.5 },
      { wicket: 3, score: 156, player: "Rohit Sharma", over: 21.4 }
    ]
  }
};

db.prepare("UPDATE Matches SET scorecard_json=? WHERE id=?").run(JSON.stringify(scorecardJson), matchId);

console.log("Match imported successfully");
