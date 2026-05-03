const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const db = new Database(path.join(__dirname, 'db', 'cricket.db'));

const content = fs.readFileSync(path.join(__dirname, 't20i_records.csv'), 'utf8');
const records = parse(content, { columns: true, skip_empty_lines: true });

const countryMap = {
  'IND': 'India',
  'AUS': 'Australia',
  'PAK': 'Pakistan',
  'ENG': 'England',
  'RSA': 'South Africa',
  'NZL': 'New Zealand',
  'WI': 'West Indies',
  'SL': 'Sri Lanka',
  'BAN': 'Bangladesh'
};

const insertPlayer = db.prepare(`
  INSERT INTO Players (name, country, role, batting_style, bowling_style, born) 
  VALUES (?, ?, ?, ?, ?, ?)
`);
const getPlayerId = db.prepare(`SELECT id FROM Players WHERE name = ?`);

const insertStat = db.prepare(`
  INSERT INTO PlayerStats (player_id, format, matches, runs, average, strike_rate, hundreds, fifties, wickets, bowl_avg) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const checkStat = db.prepare(`SELECT id FROM PlayerStats WHERE player_id = ? AND format = ?`);
const updateStat = db.prepare(`
  UPDATE PlayerStats SET matches=?, runs=?, average=?, strike_rate=?, hundreds=?, fifties=?, wickets=?, bowl_avg=?
  WHERE id=?
`);

db.transaction(() => {
  for (const row of records) {
    const name = row['Player Name'];
    const country = countryMap[row['Country']] || row['Country'];
    const role = row['Role'];
    
    // Check if player exists
    let playerRow = getPlayerId.get(name);
    let playerId;
    
    if (!playerRow) {
      const info = insertPlayer.run(name, country, role, '', '', '');
      playerId = info.lastInsertRowid;
    } else {
      playerId = playerRow.id;
    }
    
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
    
    const existingStat = checkStat.get(playerId, 'T20I');
    if (existingStat) {
      updateStat.run(matches, runs, average, strikeRate, hundreds, fifties, wickets, bowlAvg, existingStat.id);
    } else {
      insertStat.run(playerId, 'T20I', matches, runs, average, strikeRate, hundreds, fifties, wickets, bowlAvg);
    }
  }
})();

console.log("Successfully imported T20I records!");
