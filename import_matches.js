const { getDb } = require('./db/database');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

async function importMatches() {
  const db = getDb();
  const filePath = path.join(__dirname, 'matches_records.csv');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });

  console.log(`Starting import of ${records.length} matches...`);

  for (const row of records) {
    const tournamentName = row['Tournament'];
    const date = row['Date'];
    const venue = row['Venue'];
    const matchType = row['Match'];
    const team1 = row['Team_1'];
    const team2 = row['Team_2'];
    const result = row['Result'];
    
    let tFormat = 'ODI';
    if (tournamentName.includes('T20')) tFormat = 'T20I';
    if (tournamentName.includes('Test') || tournamentName.includes('Trophy')) tFormat = 'Test';
    
    let yearMatch = tournamentName.match(/\d{4}/);
    let year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
    
    // Get or Create Tournament
    let [tRows] = await db.execute(`SELECT id FROM Tournaments WHERE name = ?`, [tournamentName]);
    let tId;
    if (tRows.length === 0) {
      const [info] = await db.execute(`
        INSERT INTO Tournaments (name, year, format, host_country, winner, description) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [tournamentName, year, tFormat, '', '', '']);
      tId = info.insertId;
    } else {
      tId = tRows[0].id;
    }
    
    // Check if match already exists
    const [existingMatches] = await db.execute(`SELECT id FROM Matches WHERE tournament_id=? AND team1=? AND team2=? AND date=?`, [tId, team1, team2, date]);
    if (existingMatches.length === 0) {
      const matchFormat = `${tFormat} - ${matchType}`;
      await db.execute(`
        INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [tId, team1, team2, date, venue, matchFormat, result, '', '', '']);
    }
  }

  console.log("✅ Successfully imported matches records to MySQL!");
}

if (require.main === module) {
  importMatches();
}

module.exports = importMatches;
