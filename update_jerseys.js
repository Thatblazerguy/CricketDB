const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'db', 'cricket.db'));

try {
  db.exec('ALTER TABLE Players ADD COLUMN jersey_number INTEGER DEFAULT 0');
} catch(e) {}

const JERSEY_NUMBERS = {
  'Virat Kohli': 18,
  'KL Rahul': 1,
  'Jasprit Bumrah': 93,
  'Rohit Sharma': 45,
  'Ben Stokes': 55,
  'Mitchell Starc': 56,
  'Steve Smith': 49,
  'Joe Root': 66,
  'Babar Azam': 56,
  'Kane Williamson': 22,
  'Sachin Tendulkar': 10,
  'MS Dhoni': 7,
  'AB de Villiers': 17,
  'Lasith Malinga': 99,
  'Virender Sehwag': 44,
  'Sunil Gavaskar': 36
};

const players = db.prepare('SELECT id, name, jersey_number FROM Players').all();
const updateJersey = db.prepare('UPDATE Players SET jersey_number = ? WHERE id = ?');

for (const p of players) {
  if (JERSEY_NUMBERS[p.name]) {
    updateJersey.run(JERSEY_NUMBERS[p.name], p.id);
  } else {
    const num = Math.floor(Math.random() * 99) + 1;
    updateJersey.run(num, p.id);
  }
}

console.log("Jerseys updated!");
