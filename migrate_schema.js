const { getDb } = require('./db/database');
const db = getDb();

console.log('🔄 Migrating database schema...');

// Check if columns exist and add them if needed
const info = db.pragma('table_info(Matches)');
const colNames = info.map(c => c.name);

if (!colNames.includes('man_of_match_id')) {
  db.exec('ALTER TABLE Matches ADD COLUMN man_of_match_id INTEGER');
  console.log('✓ Added man_of_match_id column');
}

if (!colNames.includes('man_of_match_name')) {
  db.exec('ALTER TABLE Matches ADD COLUMN man_of_match_name TEXT');
  console.log('✓ Added man_of_match_name column');
}

if (!colNames.includes('scorecard_json')) {
  db.exec('ALTER TABLE Matches ADD COLUMN scorecard_json TEXT');
  console.log('✓ Added scorecard_json column');
}

// Check if MatchPerformances table exists
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='MatchPerformances'").all();
if (tables.length === 0) {
  db.exec(`
    CREATE TABLE MatchPerformances (
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
    )
  `);
  console.log('✓ Created MatchPerformances table');
}

console.log('\n✅ Database migration complete\n');
