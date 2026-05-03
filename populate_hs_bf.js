const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'cricket.db'));

const stats = db.prepare("SELECT * FROM PlayerStats").all();
const updateStat = db.prepare("UPDATE PlayerStats SET highest_score = ?, best_figures = ? WHERE id = ?");

db.transaction(() => {
  for (const s of stats) {
    let hs = 0;
    let bf = '-';

    const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Highest Score logic
    if (s.hundreds > 0) {
      hs = rnd(100, Math.min(264, 100 + s.hundreds * 20 + rnd(10, 50)));
    } else if (s.fifties > 0) {
      hs = rnd(50, 99);
    } else if (s.runs > 0) {
      hs = rnd(Math.min(s.runs, 5), Math.min(s.runs, 49));
    }

    // Best Figures logic
    if (s.wickets > 0) {
      let w = 1;
      if (s.wickets > 100) w = rnd(5, 8);
      else if (s.wickets > 50) w = rnd(4, 6);
      else if (s.wickets > 20) w = rnd(3, 5);
      else if (s.wickets > 5) w = rnd(2, 4);
      else w = rnd(1, 2);

      let r = rnd(w * 3, w * 12 + 10);
      bf = `${w}/${r}`;
    }

    updateStat.run(hs, bf, s.id);
  }
})();

console.log("Highest scores and best bowling figures generated for all players.");
