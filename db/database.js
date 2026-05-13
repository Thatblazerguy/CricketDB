const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'cricket.db'));
db.pragma('journal_mode = WAL');

module.exports = {
  getDb: () => db
};
