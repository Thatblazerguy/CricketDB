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
  { country: 'India', name: 'Rohit Sharma', role: 'Captain/Batsman', batting_style: 'Right-handed', bowling_style: 'Right-arm off-break', jersey: 45, stats: {format:'ODI',matches:255,runs:9500,average:49.6,strike_rate:88.1,hundreds:29,fifties:58,wickets:0,bowl_avg:0} },
  { country: 'India', name: 'Shubman Gill', role: 'Batsman', batting_style: 'Right-handed', bowling_style: 'Right-arm medium', jersey: 76, stats: {format:'ODI',matches:55,runs:2190,average:45.6,strike_rate:87.0,hundreds:5,fifties:17,wickets:0,bowl_avg:0} },
  { country: 'India', name: 'Virat Kohli', role: 'Batsman', batting_style: 'Right-handed', bowling_style: 'Right-arm medium', jersey: 18, stats: {format:'ODI',matches:292,runs:12809,average:57.4,strike_rate:92.1,hundreds:46,fifties:65,wickets:0,bowl_avg:0} },
  { country: 'India', name: 'Shreyas Iyer', role: 'Batsman', batting_style: 'Right-handed', bowling_style: 'Right-arm off-break', jersey: 24, stats: {format:'ODI',matches:45,runs:1600,average:38.4,strike_rate:85.3,hundreds:2,fifties:10,wickets:0,bowl_avg:0} },
  { country: 'India', name: 'KL Rahul', role: 'Wicketkeeper-Batsman', batting_style: 'Right-handed', bowling_style: 'Right-arm medium', jersey: 1, stats: {format:'ODI',matches:70,runs:2330,average:44.0,strike_rate:90.1,hundreds:8,fifties:18,wickets:0,bowl_avg:0} },
  { country: 'India', name: 'Hardik Pandya', role: 'All-rounder', batting_style: 'Right-handed', bowling_style: 'Right-arm fast-medium', jersey: 33, stats: {format:'ODI',matches:90,runs:2300,average:32.5,strike_rate:106.3,hundreds:2,fifties:18,wickets:140,bowl_avg:34.5} },
  { country: 'India', name: 'Ravindra Jadeja', role: 'All-rounder', batting_style: 'Left-handed', bowling_style: 'Slow left-arm orthodox', jersey: 8, stats: {format:'ODI',matches:125,runs:2320,average:35.5,strike_rate:88.7,hundreds:1,fifties:18,wickets:192,bowl_avg:27.7} },
  { country: 'India', name: 'Shardul Thakur', role: 'All-rounder', batting_style: 'Right-handed', bowling_style: 'Right-arm medium-fast', jersey: 54, stats: {format:'ODI',matches:70,runs:800,average:23.5,strike_rate:88.0,hundreds:0,fifties:1,wickets:100,bowl_avg:33.4} },
  { country: 'India', name: 'Jasprit Bumrah', role: 'Bowler', batting_style: 'Right-handed', bowling_style: 'Right-arm fast', jersey: 93, stats: {format:'ODI',matches:110,runs:800,average:16.7,strike_rate:84.2,hundreds:0,fifties:0,wickets:150,bowl_avg:24.1} },
  { country: 'India', name: 'Kuldeep Yadav', role: 'Bowler', batting_style: 'Left-handed', bowling_style: 'Slow left-arm wrist-spin', jersey: 23, stats: {format:'ODI',matches:90,runs:1200,average:17.1,strike_rate:87.2,hundreds:0,fifties:2,wickets:120,bowl_avg:28.4} },
  { country: 'India', name: 'Mohammed Siraj', role: 'Bowler', batting_style: 'Right-handed', bowling_style: 'Right-arm fast', jersey: 13, stats: {format:'ODI',matches:70,runs:100,average:10.0,strike_rate:45.5,hundreds:0,fifties:0,wickets:120,bowl_avg:26.8} },
  { country: 'Pakistan', name: 'Abdullah Shafique', role: 'Batsman', batting_style: 'Right-handed', bowling_style: 'Right-arm off-break', jersey: 65, stats: {format:'ODI',matches:20,runs:690,average:38.3,strike_rate:75.5,hundreds:2,fifties:4,wickets:0,bowl_avg:0} },
  { country: 'Pakistan', name: 'Imam-ul-Haq', role: 'Batsman', batting_style: 'Left-handed', bowling_style: 'Right-arm medium', jersey: 25, stats: {format:'ODI',matches:40,runs:1400,average:42.4,strike_rate:78.1,hundreds:4,fifties:8,wickets:0,bowl_avg:0} },
  { country: 'Pakistan', name: 'Babar Azam', role: 'Captain/Batsman', batting_style: 'Right-handed', bowling_style: 'Right-arm off-break', jersey: 56, stats: {format:'ODI',matches:100,runs:5000,average:56.5,strike_rate:87.2,hundreds:12,fifties:28,wickets:0,bowl_avg:0} },
  { country: 'Pakistan', name: 'Mohammad Rizwan', role: 'Wicketkeeper-Batsman', batting_style: 'Right-handed', bowling_style: 'Right-arm medium', jersey: 45, stats: {format:'ODI',matches:100,runs:3500,average:47.1,strike_rate:88.4,hundreds:5,fifties:28,wickets:0,bowl_avg:0} },
  { country: 'Pakistan', name: 'Saud Shakeel', role: 'Batsman', batting_style: 'Left-handed', bowling_style: 'Right-arm off-break', jersey: 12, stats: {format:'ODI',matches:15,runs:470,average:32.0,strike_rate:72.3,hundreds:0,fifties:2,wickets:0,bowl_avg:0} },
  { country: 'Pakistan', name: 'Iftikhar Ahmed', role: 'All-rounder', batting_style: 'Right-handed', bowling_style: 'Right-arm medium-fast', jersey: 77, stats: {format:'ODI',matches:30,runs:380,average:22.4,strike_rate:96.5,hundreds:0,fifties:1,wickets:30,bowl_avg:40.0} },
  { country: 'Pakistan', name: 'Shadab Khan', role: 'All-rounder', batting_style: 'Left-handed', bowling_style: 'Right-arm leg-break', jersey: 3, stats: {format:'ODI',matches:95,runs:1300,average:24.5,strike_rate:97.5,hundreds:0,fifties:4,wickets:125,bowl_avg:28.7} },
  { country: 'Pakistan', name: 'Mohammad Nawaz', role: 'All-rounder', batting_style: 'Left-handed', bowling_style: 'Slow left-arm orthodox', jersey: 55, stats: {format:'ODI',matches:70,runs:950,average:22.1,strike_rate:89.2,hundreds:0,fifties:2,wickets:90,bowl_avg:31.5} },
  { country: 'Pakistan', name: 'Hasan Ali', role: 'Bowler', batting_style: 'Right-handed', bowling_style: 'Right-arm fast', jersey: 5, stats: {format:'ODI',matches:80,runs:250,average:14.7,strike_rate:88.5,hundreds:0,fifties:0,wickets:180,bowl_avg:26.9} },
  { country: 'Pakistan', name: 'Shaheen Shah Afridi', role: 'Bowler', batting_style: 'Left-handed', bowling_style: 'Left-arm fast', jersey: 10, stats: {format:'ODI',matches:85,runs:255,average:7.9,strike_rate:95.7,hundreds:0,fifties:0,wickets:180,bowl_avg:22.6} },
  { country: 'Pakistan', name: 'Haris Rauf', role: 'Bowler', batting_style: 'Right-handed', bowling_style: 'Right-arm fast', jersey: 77, stats: {format:'ODI',matches:65,runs:120,average:11.0,strike_rate:100.0,hundreds:0,fifties:0,wickets:120,bowl_avg:25.8} }
];

db.transaction(() => {
  const getStatsCount = db.prepare("SELECT COUNT(*) as count FROM PlayerStats WHERE player_id = ?");
  for (const p of playersList) {
    const player = getPlayer.get(p.name);
    if (!player) {
      const jersey = p.jersey || Math.floor(Math.random() * 99) + 1;
      const info = insertPlayer.run(p.name, p.country, p.role, p.batting_style, p.bowling_style, jersey);
      const stats = p.stats;
      insertStat.run(info.lastInsertRowid, stats.format, stats.matches, stats.runs, stats.average, stats.strike_rate, stats.hundreds, stats.fifties, stats.wickets, stats.bowl_avg);
    } else {
      const statCount = getStatsCount.get(player.id).count;
      if (!statCount) {
        const stats = p.stats;
        insertStat.run(player.id, stats.format, stats.matches, stats.runs, stats.average, stats.strike_rate, stats.hundreds, stats.fifties, stats.wickets, stats.bowl_avg);
      }
    }
  }
})();

const tournamentSelector = db.prepare("SELECT id FROM Tournaments WHERE name LIKE '%ICC ODI WC 2023%' OR name LIKE '%ICC Cricket World Cup%'");
const insertTournament = db.prepare('INSERT INTO Tournaments (name, year, format, host_country, winner, description) VALUES (?,?,?,?,?,?)');
let tId;
const tIdRow = tournamentSelector.get();
if (tIdRow) {
  tId = tIdRow.id;
} else {
  const info = insertTournament.run('ICC Cricket World Cup', 2023, 'ODI', 'India', 'Australia', 'ICC ODI World Cup final held in Ahmedabad');
  tId = info.lastInsertRowid;
}

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
    fallOfWickets: [
      { wicket: 1, score: 20, player: "Abdullah Shafique", over: 3.2 },
      { wicket: 2, score: 58, player: "Imam-ul-Haq", over: 11.1 },
      { wicket: 3, score: 110, player: "Babar Azam", over: 25.4 },
      { wicket: 4, score: 150, player: "Mohammad Rizwan", over: 34.3 },
      { wicket: 5, score: 160, player: "Saud Shakeel", over: 37.1 },
      { wicket: 6, score: 167, player: "Iftikhar Ahmed", over: 38.6 },
      { wicket: 7, score: 171, player: "Shadab Khan", over: 39.5 },
      { wicket: 8, score: 176, player: "Mohammad Nawaz", over: 40.4 },
      { wicket: 9, score: 185, player: "Hasan Ali", over: 41.3 },
      { wicket: 10, score: 191, player: "Haris Rauf", over: 42.5 }
    ]
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
