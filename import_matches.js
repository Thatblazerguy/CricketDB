const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const db = new Database(path.join(__dirname, 'db', 'cricket.db'));

const content = fs.readFileSync(path.join(__dirname, 'matches_records.csv'), 'utf8');
const records = parse(content, { columns: true, skip_empty_lines: true });

const getTournamentId = db.prepare(`SELECT id FROM Tournaments WHERE name = ?`);
const insertTournament = db.prepare(`
  INSERT INTO Tournaments (name, year, format, host_country, winner, description) 
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertMatch = db.prepare(`
  INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const checkMatch = db.prepare(`SELECT id FROM Matches WHERE tournament_id=? AND team1=? AND team2=? AND date=?`);

db.transaction(() => {
  for (const row of records) {
    const tournamentName = row['Tournament'];
    const date = row['Date'];
    const venue = row['Venue'];
    const matchType = row['Match'];
    const team1 = row['Team_1'];
    const team2 = row['Team_2'];
    const result = row['Result'];
    
    // Determine tournament format and year from name
    let tFormat = 'ODI';
    if (tournamentName.includes('T20')) tFormat = 'T20I';
    if (tournamentName.includes('Test') || tournamentName.includes('Trophy')) tFormat = 'Test';
    
    let yearMatch = tournamentName.match(/\d{4}/);
    let year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
    
    let tRow = getTournamentId.get(tournamentName);
    let tId;
    if (!tRow) {
      const info = insertTournament.run(tournamentName, year, tFormat, '', '', '');
      tId = info.lastInsertRowid;
    } else {
      tId = tRow.id;
    }
    
    // Check if match already exists
    const existingMatch = checkMatch.get(tId, team1, team2, date);
    if (!existingMatch) {
      const matchFormat = `${tFormat} - ${matchType}`;
      insertMatch.run(tId, team1, team2, date, venue, matchFormat, result, '', '', '');
    }
  }
})();

console.log("Successfully imported matches records!");
