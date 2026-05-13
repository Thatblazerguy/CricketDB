const { getDb } = require('./database');

function initializeDatabase() {
  const db = getDb();
  
  console.log('⏳ Initializing SQLite database...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      username  TEXT UNIQUE NOT NULL,
      email     TEXT UNIQUE NOT NULL,
      password  TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Tournaments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      year         INTEGER NOT NULL,
      format       TEXT NOT NULL,
      host_country TEXT,
      winner       TEXT,
      description  TEXT,
      UNIQUE(name, year)
    );

    CREATE TABLE IF NOT EXISTS Players (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      country       TEXT NOT NULL,
      role          TEXT NOT NULL,
      batting_style TEXT,
      bowling_style TEXT,
      born          TEXT,
      image_url     TEXT,
      jersey_number INTEGER
    );

    CREATE TABLE IF NOT EXISTS PlayerStats (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id     INTEGER NOT NULL,
      format        TEXT NOT NULL,
      matches       INTEGER DEFAULT 0,
      innings       INTEGER DEFAULT 0,
      runs          INTEGER DEFAULT 0,
      average       REAL DEFAULT 0.0,
      strike_rate   REAL DEFAULT 0.0,
      highest_score INTEGER DEFAULT 0,
      hundreds      INTEGER DEFAULT 0,
      fifties       INTEGER DEFAULT 0,
      wickets       INTEGER DEFAULT 0,
      bowl_avg      REAL DEFAULT 0.0,
      best_figures  TEXT DEFAULT '-',
      FOREIGN KEY (player_id) REFERENCES Players(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Matches (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id    INTEGER,
      team1            TEXT NOT NULL,
      team2            TEXT NOT NULL,
      date             TEXT,
      venue            TEXT,
      format           TEXT,
      result           TEXT,
      score_team1      TEXT,
      score_team2      TEXT,
      highlights       TEXT,
      man_of_match_id  INTEGER,
      man_of_match_name TEXT,
      scorecard_json   TEXT,
      FOREIGN KEY (tournament_id) REFERENCES Tournaments(id)
    );

    CREATE TABLE IF NOT EXISTS TournamentStats (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      player_id     INTEGER NOT NULL,
      stat_type     TEXT NOT NULL,
      value         INTEGER DEFAULT 0,
      innings       INTEGER DEFAULT 0,
      average       REAL DEFAULT 0.0,
      FOREIGN KEY (tournament_id) REFERENCES Tournaments(id),
      FOREIGN KEY (player_id) REFERENCES Players(id)
    );

    CREATE TABLE IF NOT EXISTS UserFavorites (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id  INTEGER NOT NULL,
      type     TEXT NOT NULL,
      ref_id   INTEGER,
      ref_name TEXT,
      UNIQUE(user_id, type, ref_id),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
  `);

  // Seeding
  const tournamentCount = db.prepare('SELECT COUNT(*) as count FROM Tournaments').get().count;
  if (tournamentCount === 0) {
    console.log('🌱 Seeding initial tournaments...');
    const insertT = db.prepare('INSERT INTO Tournaments (name, year, format, host_country, winner, description) VALUES (?, ?, ?, ?, ?, ?)');
    insertT.run('ICC ODI World Cup', 2023, 'ODI', 'India', 'Australia', 'The flagship 50-over tournament held across India.');
    insertT.run('ICC T20 World Cup', 2024, 'T20I', 'USA & West Indies', 'India', 'The biggest T20I tournament featuring 20 teams.');
    insertT.run('Border Gavaskar Trophy', 2024, 'Test', 'Australia', 'India', 'Elite Test series between India and Australia.');
  }

  console.log('✅ SQLite Database initialized.');
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
