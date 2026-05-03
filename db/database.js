const Database = require('better-sqlite3');
const path = require('path');

let _db;
function getDb() {
  if (!_db) {
    _db = new Database(path.join(__dirname, 'cricket.db'));
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

module.exports = { getDb };
