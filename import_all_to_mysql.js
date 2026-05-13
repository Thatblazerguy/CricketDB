const { getDb } = require('./db/database');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const countryMap = {
  'IND': 'India',
  'AUS': 'Australia',
  'PAK': 'Pakistan',
  'ENG': 'England',
  'RSA': 'South Africa',
  'NZL': 'New Zealand',
  'WI': 'West Indies',
  'SL': 'Sri Lanka',
  'BAN': 'Bangladesh',
  'AFG': 'Afghanistan',
  'NED': 'Netherlands'
};

async function importPlayersAndStats(csvPath, format) {
  const db = getDb();
  if (!fs.existsSync(csvPath)) {
    console.warn(`File not found: ${csvPath}`);
    return;
  }
  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });

  console.log(`⏳ Importing ${format} records (${records.length})...`);

  for (const row of records) {
    const name = row['Player Name'];
    const country = countryMap[row['Country']] || row['Country'];
    const role = row['Role'];

    // 1. Get or Create Player
    let [pRows] = await db.execute('SELECT id FROM Players WHERE name = ?', [name]);
    let playerId;
    if (pRows.length === 0) {
      const [info] = await db.execute(
        'INSERT INTO Players (name, country, role, batting_style, bowling_style, born) VALUES (?, ?, ?, ?, ?, ?)',
        [name, country, role, '', '', '']
      );
      playerId = info.insertId;
    } else {
      playerId = pRows[0].id;
    }

    // 2. Parse stats
    const batMat = parseInt(row['Bat Mat'] || 0);
    const bowlMat = parseInt(row['Bowl Mat'] || 0);
    const matches = Math.max(batMat, bowlMat);
    const runs = parseInt(row['Runs'] || 0);
    const average = parseFloat(row['Bat Avg'] || 0);
    const strikeRate = parseFloat(row['Bat SR'] || 0);
    const hundreds = parseInt(row['100s'] || 0);
    const fifties = parseInt(row['50s'] || 0);
    const wickets = parseInt(row['Wickets'] || 0);
    const bowlAvg = parseFloat(row['Bowl Avg'] || 0);
    const highestScore = parseInt(row['HS'] || 0);
    const bestFigures = row['BBI'] || '-';

    // 3. Upsert Stats
    const [existingStat] = await db.execute('SELECT id FROM PlayerStats WHERE player_id = ? AND format = ?', [playerId, format]);
    if (existingStat.length > 0) {
      await db.execute(
        'UPDATE PlayerStats SET matches=?, runs=?, average=?, strike_rate=?, highest_score=?, hundreds=?, fifties=?, wickets=?, bowl_avg=?, best_figures=? WHERE id=?',
        [matches, runs, average, strikeRate, highestScore, hundreds, fifties, wickets, bowlAvg, bestFigures, existingStat[0].id]
      );
    } else {
      await db.execute(
        'INSERT INTO PlayerStats (player_id, format, matches, runs, average, strike_rate, highest_score, hundreds, fifties, wickets, bowl_avg, best_figures) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [playerId, format, matches, runs, average, strikeRate, highestScore, hundreds, fifties, wickets, bowlAvg, bestFigures]
      );
    }
  }
}

async function importMatches(csvPath) {
  const db = getDb();
  if (!fs.existsSync(csvPath)) {
    console.warn(`File not found: ${csvPath}`);
    return;
  }
  const content = fs.readFileSync(csvPath, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });

  console.log(`⏳ Importing Matches (${records.length})...`);

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
    let [tRows] = await db.execute('SELECT id FROM Tournaments WHERE name = ?', [tournamentName]);
    let tId;
    if (tRows.length === 0) {
      const [info] = await db.execute(
        'INSERT INTO Tournaments (name, year, format, host_country, winner, description) VALUES (?, ?, ?, ?, ?, ?)',
        [tournamentName, year, tFormat, '', '', '']
      );
      tId = info.insertId;
    } else {
      tId = tRows[0].id;
    }
    
    // Check if match already exists
    const [existing] = await db.execute('SELECT id FROM Matches WHERE tournament_id=? AND team1=? AND team2=? AND date=?', [tId, team1, team2, date]);
    if (existing.length === 0) {
      const matchFormat = `${tFormat} - ${matchType}`;
      await db.execute(
        'INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [tId, team1, team2, date, venue, matchFormat, result, '', '', '']
      );
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting full data import to MySQL...');
    
    await importPlayersAndStats(path.join(__dirname, 'odi_records.csv'), 'ODI');
    await importPlayersAndStats(path.join(__dirname, 't20i_records.csv'), 'T20I');
    await importPlayersAndStats(path.join(__dirname, 'test_records.csv'), 'Test');
    await importMatches(path.join(__dirname, 'matches_records.csv'));

    console.log('✅ All data imported successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Import failed:', err);
    process.exit(1);
  }
}

main();
