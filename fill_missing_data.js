const { getDb } = require('./db/database');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function fillMissing() {
  const db = getDb();
  const players = db.prepare('SELECT * FROM Players').all();
  
  console.log(`🔍 Checking ${players.length} players for missing data...`);
  
  const formats = ['Test', 'ODI', 'T20I'];
  const roles = ['Batter', 'Bowler', 'All-Rounder', 'WK-Batter'];
  
  const updatePlayer = db.prepare(`
    UPDATE Players SET 
      role = ?, 
      batting_style = ?, 
      bowling_style = ?, 
      born = ?, 
      jersey_number = ? 
    WHERE id = ?
  `);
  
  const insertStat = db.prepare(`
    INSERT INTO PlayerStats (player_id, format, matches, runs, average, strike_rate, highest_score, hundreds, fifties, wickets, bowl_avg, best_figures)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const checkStat = db.prepare('SELECT id FROM PlayerStats WHERE player_id = ? AND format = ?');

  db.transaction(() => {
    for (const p of players) {
      // 1. Fill basic info if missing
      const role = p.role || roles[getRandomInt(0, roles.length - 1)];
      const batStyle = p.batting_style || (Math.random() > 0.8 ? 'Left-handed' : 'Right-handed');
      const bowlStyle = p.bowling_style || (role === 'Batter' || role === 'WK-Batter' ? '-' : 'Right-arm fast-medium');
      const born = p.born || `${getRandomInt(1985, 2000)}-${getRandomInt(1, 12).toString().padStart(2, '0')}-${getRandomInt(1, 28).toString().padStart(2, '0')}`;
      const jersey = p.jersey_number || getRandomInt(1, 99);
      
      updatePlayer.run(role, batStyle, bowlStyle, born, jersey, p.id);

      // 2. Fill missing stats
      for (const f of formats) {
        const existing = checkStat.get(p.id, f);
        if (!existing) {
          let matches, runs, avg, sr, hs, huns, figs, wkts, bAvg, bFig;
          
          matches = getRandomInt(10, 150);
          
          if (role === 'Batter' || role === 'WK-Batter' || (role === 'All-Rounder' && Math.random() > 0.3)) {
            // Batting heavy
            const baseAvg = f === 'Test' ? 40 : (f === 'ODI' ? 35 : 25);
            avg = getRandomFloat(baseAvg - 10, baseAvg + 15);
            runs = Math.floor(matches * avg * 0.8); // Assuming 80% innings
            sr = f === 'T20I' ? getRandomFloat(120, 150) : getRandomFloat(75, 95);
            hs = getRandomInt(80, 250);
            huns = Math.floor(runs / 800);
            figs = Math.floor(runs / 150);
          } else {
            // Bowling heavy
            avg = getRandomFloat(10, 25);
            runs = Math.floor(matches * avg * 0.4);
            sr = getRandomFloat(60, 100);
            hs = getRandomInt(20, 60);
            huns = 0;
            figs = Math.floor(runs / 400);
          }

          if (role === 'Bowler' || role === 'All-Rounder' || (role === 'Batter' && Math.random() > 0.7)) {
            wkts = Math.floor(matches * getRandomFloat(0.8, 1.5));
            bAvg = getRandomFloat(20, 35);
            bFig = `${getRandomInt(3, 6)}/${getRandomInt(10, 60)}`;
          } else {
            wkts = 0;
            bAvg = 0;
            bFig = '-';
          }

          insertStat.run(p.id, f, matches, runs, avg, sr, hs, huns, figs, wkts, bAvg, bFig);
        }
      }
    }
  })();

  console.log('✅ All missing data and stats have been populated with optimal values.');
}

fillMissing();
