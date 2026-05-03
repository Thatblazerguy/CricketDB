const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(__dirname, 'cricket.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT UNIQUE NOT NULL,
    email     TEXT UNIQUE NOT NULL,
    password  TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Tournaments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    year        INTEGER NOT NULL,
    format      TEXT NOT NULL,
    host_country TEXT,
    winner      TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS Players (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    country       TEXT NOT NULL,
    role          TEXT NOT NULL,
    batting_style TEXT,
    bowling_style TEXT,
    born          TEXT,
    image_url     TEXT
  );

  CREATE TABLE IF NOT EXISTS PlayerStats (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id  INTEGER NOT NULL,
    format     TEXT NOT NULL CHECK(format IN ('Test','ODI','T20I')),
    matches    INTEGER DEFAULT 0,
    innings    INTEGER DEFAULT 0,
    runs       INTEGER DEFAULT 0,
    average    REAL DEFAULT 0.0,
    strike_rate REAL DEFAULT 0.0,
    highest_score INTEGER DEFAULT 0,
    hundreds   INTEGER DEFAULT 0,
    fifties    INTEGER DEFAULT 0,
    wickets    INTEGER DEFAULT 0,
    bowl_avg   REAL DEFAULT 0.0,
    best_figures TEXT DEFAULT '-',
    FOREIGN KEY (player_id) REFERENCES Players(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Matches (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id  INTEGER,
    team1          TEXT NOT NULL,
    team2          TEXT NOT NULL,
    date           TEXT,
    venue          TEXT,
    format         TEXT,
    result         TEXT,
    score_team1    TEXT,
    score_team2    TEXT,
    highlights     TEXT,
    man_of_match_id INTEGER,
    man_of_match_name TEXT,
    scorecard_json TEXT,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id)
  );

  CREATE TABLE IF NOT EXISTS TournamentStats (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    player_id     INTEGER NOT NULL,
    stat_type     TEXT NOT NULL CHECK(stat_type IN ('runs','wickets')),
    value         INTEGER DEFAULT 0,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id),
    FOREIGN KEY (player_id) REFERENCES Players(id)
  );

  CREATE TABLE IF NOT EXISTS PointsTable (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    team          TEXT NOT NULL,
    played        INTEGER DEFAULT 0,
    won           INTEGER DEFAULT 0,
    lost          INTEGER DEFAULT 0,
    tied          INTEGER DEFAULT 0,
    points        INTEGER DEFAULT 0,
    nrr           REAL DEFAULT 0.0,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id)
  );

  CREATE TABLE IF NOT EXISTS UserFavorites (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    type      TEXT NOT NULL CHECK(type IN ('player','team')),
    ref_id    INTEGER,
    ref_name  TEXT,
    UNIQUE(user_id, type, ref_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS MatchPerformances (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id     INTEGER NOT NULL,
    player_id    INTEGER,
    player_name  TEXT NOT NULL,
    country      TEXT NOT NULL,
    role         TEXT NOT NULL,
    runs         INTEGER DEFAULT 0,
    balls        INTEGER DEFAULT 0,
    minutes      INTEGER DEFAULT 0,
    fours        INTEGER DEFAULT 0,
    sixes        INTEGER DEFAULT 0,
    dismissal    TEXT,
    overs        REAL DEFAULT 0,
    maidens      INTEGER DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    wickets      INTEGER DEFAULT 0,
    economy      REAL DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES Matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES Players(id)
  );
`);


// ─── SEED DATA ────────────────────────────────────────────────────────────────
const insertTournament = db.prepare(`
  INSERT OR IGNORE INTO Tournaments (id,name,year,format,host_country,winner,description) VALUES (?,?,?,?,?,?,?)
`);
const insertPlayer = db.prepare(`
  INSERT OR IGNORE INTO Players (id,name,country,role,batting_style,bowling_style,born) VALUES (?,?,?,?,?,?,?)
`);
const insertStat = db.prepare(`
  INSERT OR IGNORE INTO PlayerStats (player_id,format,matches,runs,average,strike_rate,hundreds,fifties,wickets,bowl_avg) VALUES (?,?,?,?,?,?,?,?,?,?)
`);
const insertMatch = db.prepare(`
  INSERT OR IGNORE INTO Matches (id,tournament_id,team1,team2,date,venue,format,result,score_team1,score_team2,highlights) VALUES (?,?,?,?,?,?,?,?,?,?,?)
`);
const insertPoints = db.prepare(`
  INSERT OR IGNORE INTO PointsTable (tournament_id,team,played,won,lost,tied,points,nrr) VALUES (?,?,?,?,?,?,?,?)
`);
const insertTStat = db.prepare(`
  INSERT OR IGNORE INTO TournamentStats (tournament_id,player_id,stat_type,value) VALUES (?,?,?,?)
`);

const seedAll = db.transaction(() => {
  // Tournaments
  insertTournament.run(1,'ICC Cricket World Cup',2023,'ODI','India','Australia','50-over tournament held across India');
  insertTournament.run(2,'ICC T20 World Cup',2024,'T20I','USA & West Indies','India','T20 showpiece held across USA and West Indies');
  insertTournament.run(3,'ICC World Test Championship',2023,'Test','England','Australia','Elite Test championship final at The Oval');
  insertTournament.run(4,'ICC Champions Trophy',2025,'ODI','Pakistan','India','50-over mini-World Cup');

  // Players
  insertPlayer.run(1,'Virat Kohli','India','Batter','Right-handed','Right-arm medium','Nov 5, 1988');
  insertPlayer.run(2,'KL Rahul','India','Batter / WK','Right-handed','-','Apr 18, 1992');
  insertPlayer.run(3,'Jasprit Bumrah','India','Bowler','Right-handed','Right-arm fast','Dec 6, 1993');
  insertPlayer.run(4,'Rohit Sharma','India','Batter','Right-handed','Right-arm off-break','Apr 30, 1987');
  insertPlayer.run(5,'Ben Stokes','England','All-rounder','Left-handed','Right-arm fast-medium','Jun 4, 1991');
  insertPlayer.run(6,'Mitchell Starc','Australia','Bowler','Left-handed','Left-arm fast','Jan 30, 1990');
  insertPlayer.run(7,'Steve Smith','Australia','Batter','Right-handed','Right-arm leg-break','Jun 2, 1989');
  insertPlayer.run(8,'Joe Root','England','Batter','Right-handed','Right-arm off-break','Dec 30, 1990');
  insertPlayer.run(9,'Babar Azam','Pakistan','Batter','Right-handed','Right-arm medium','Oct 15, 1994');
  insertPlayer.run(10,'Kane Williamson','New Zealand','Batter','Right-handed','Right-arm off-break','Aug 8, 1990');

  // Player Stats
  insertStat.run(1,'Test',113,9230,48.85,57.2,29,30,0,0);
  insertStat.run(1,'ODI',292,13906,58.18,93.2,50,68,0,0);
  insertStat.run(1,'T20I',125,4188,52.35,137.0,1,37,0,0);
  insertStat.run(2,'Test',67,4053,35.86,49.1,10,20,0,0);
  insertStat.run(2,'ODI',94,3360,50.90,82.4,5,26,0,0);
  insertStat.run(2,'T20I',72,2265,37.75,136.8,2,20,0,0);
  insertStat.run(3,'Test',39,0,0,0,0,0,195,21.3);
  insertStat.run(3,'ODI',90,0,0,0,0,0,149,24.5);
  insertStat.run(3,'T20I',85,0,0,0,0,0,90,18.6);
  insertStat.run(4,'Test',67,4301,40.57,57.0,12,19,0,0);
  insertStat.run(4,'ODI',264,10709,48.67,89.9,31,57,0,0);
  insertStat.run(4,'T20I',159,4231,32.05,140.9,5,32,0,0);
  insertStat.run(5,'Test',105,6512,36.95,57.2,13,32,196,31.4);
  insertStat.run(5,'ODI',105,2924,39.78,95.4,3,21,74,42.1);
  insertStat.run(5,'T20I',41,546,19.5,131.7,0,2,22,29.8);
  insertStat.run(6,'Test',82,0,0,0,0,0,322,27.2);
  insertStat.run(6,'ODI',115,0,0,0,0,0,235,22.5);
  insertStat.run(6,'T20I',60,0,0,0,0,0,79,20.1);
  insertStat.run(7,'Test',104,9154,58.68,55.3,32,37,0,0);
  insertStat.run(7,'ODI',161,4752,44.0,87.2,12,28,0,0);
  insertStat.run(7,'T20I',49,982,27.28,127.5,0,7,0,0);
  insertStat.run(8,'Test',146,12704,50.42,56.1,35,63,0,0);
  insertStat.run(8,'ODI',169,6207,49.27,87.4,17,39,0,0);
  insertStat.run(8,'T20I',32,893,34.35,127.0,0,8,0,0);
  insertStat.run(9,'Test',56,4022,46.77,52.6,9,22,0,0);
  insertStat.run(9,'ODI',116,5571,57.43,88.3,20,29,0,0);
  insertStat.run(9,'T20I',122,4067,44.70,130.0,3,36,0,0);
  insertStat.run(10,'Test',104,8931,54.43,50.1,33,38,0,0);
  insertStat.run(10,'ODI',168,6554,47.14,81.6,13,44,0,0);
  insertStat.run(10,'T20I',89,2265,32.37,122.0,0,13,0,0);

  // Matches
  insertMatch.run(1,1,'India','Australia','Nov 19, 2023','Narendra Modi Stadium, Ahmedabad','ODI','Australia won by 6 wickets','240/10','241/4',"Mitchell Starc picked up 3 wickets early. Travis Head smashed 137 to seal Australia's 6th World Cup title.");
  insertMatch.run(2,1,'India','New Zealand','Oct 22, 2023','HPCA Stadium, Dharamsala','ODI','India won by 4 wickets','273/7','276/6','Rohit Sharma scored 46 off 31. Shreyas Iyer held the chase together with 77.');
  insertMatch.run(3,1,'England','Pakistan','Oct 28, 2023','Eden Gardens, Kolkata','ODI','England won by 93 runs','337/9','244/10','Joe Root anchored with 82. Liam Livingstone hit a blistering 44 off 18 balls.');
  insertMatch.run(4,2,'India','South Africa','Jun 29, 2024','Kensington Oval, Barbados','T20I','India won by 7 runs','176/4','169/8','Virat Kohli scored 76. Arshdeep Singh was outstanding with 2-20 in the final over.');
  insertMatch.run(5,3,'Australia','India','Jun 11, 2023','The Oval, London','Test','Australia won by 209 runs','469 & 270/8d','244 & 234','Steve Smith scored 121. Nathan Lyon took 9 wickets across both innings.');
  insertMatch.run(6,4,'India','Pakistan','Feb 23, 2025','Dubai International Cricket Stadium','ODI','India won by 6 wickets','241/7','242/4','Shubman Gill scored unbeaten 101. Bumrah took 3-28 to restrict Pakistan.');

  // Points Table (Empty here, we use import_wc_stats.js for accurate data)
  // Tournament stats (Empty here, we use import_wc_stats.js for accurate data)
});

seedAll();

console.log('✅ Database initialised and seeded successfully.');
module.exports = db;
