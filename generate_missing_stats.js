const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'cricket.db'));

const players = db.prepare("SELECT * FROM Players").all();
const checkStat = db.prepare("SELECT count(*) as count FROM PlayerStats WHERE player_id = ? AND format = ?");
const insertStat = db.prepare("INSERT INTO PlayerStats (player_id, format, matches, runs, average, strike_rate, hundreds, fifties, wickets, bowl_avg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

const formats = ['Test', 'ODI', 'T20I'];

db.transaction(() => {
  for (const p of players) {
    for (const f of formats) {
      const res = checkStat.get(p.id, f);
      if (res.count === 0) {
        let matches, runs, avg, sr, hundreds, fifties, wickets, bowlAvg;

        const role = (p.role || '').toLowerCase();
        
        // Mid-range randomizer helpers
        const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const rndF = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

        matches = rnd(10, 50);

        if (role.includes('batsman') || role.includes('wicketkeeper')) {
          avg = rndF(32, 48);
          runs = Math.floor(matches * avg * 0.85); // assume some not outs
          sr = f === 'T20I' ? rndF(125, 145) : (f === 'ODI' ? rndF(85, 105) : rndF(45, 55));
          hundreds = Math.floor(runs / 1000);
          fifties = Math.floor(runs / 300);
          wickets = rnd(0, 3);
          bowlAvg = wickets > 0 ? rndF(40, 70) : 0;
        } else if (role.includes('bowler')) {
          avg = rndF(8, 18);
          runs = Math.floor(matches * avg * 0.5);
          sr = f === 'T20I' ? rndF(110, 130) : (f === 'ODI' ? rndF(70, 90) : rndF(35, 45));
          hundreds = 0;
          fifties = rnd(0, 1);
          wickets = rnd(matches * 1.1, matches * 1.6);
          bowlAvg = rndF(21, 29);
        } else if (role.includes('all-rounder')) {
          avg = rndF(24, 34);
          runs = Math.floor(matches * avg * 0.7);
          sr = f === 'T20I' ? rndF(130, 150) : (f === 'ODI' ? rndF(90, 115) : rndF(40, 50));
          hundreds = Math.floor(runs / 1500);
          fifties = Math.floor(runs / 500);
          wickets = rnd(matches * 0.7, matches * 1.1);
          bowlAvg = rndF(26, 36);
        } else {
          // Default fallback
          avg = rndF(15, 30);
          runs = Math.floor(matches * avg * 0.75);
          sr = rndF(70, 110);
          hundreds = 0;
          fifties = rnd(0, 2);
          wickets = rnd(0, matches);
          bowlAvg = wickets > 0 ? rndF(30, 50) : 0;
        }

        insertStat.run(p.id, f, matches, runs, avg, sr, hundreds, fifties, wickets, bowlAvg);
      }
    }
  }
})();

console.log("Mid-range stats generated for all players with missing records across all formats.");
