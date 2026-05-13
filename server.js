const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

if (isSupabaseConfigured) {
  console.log('✅ Supabase configuration detected.');
} else {
  console.log('⚠️ Supabase not configured. Using local SQLite for auth.');
}

const { initializeDatabase } = require('./db/init');
const { getDb } = require('./db/database');

// Initialize SQLite DB
initializeDatabase();

const app = express();
const PORT = 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'cricket_db_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

const upload = multer({ dest: path.join(__dirname, 'uploads/') });
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorised' });
  next();
};

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields required' });
    
    const hash = bcrypt.hashSync(password, 10);

    if (supabase) {
      const { data: existing, error: checkError } = await supabase.from('users').select('id').or(`email.eq.${email},username.eq.${username}`).maybeSingle();
      if (checkError) throw checkError;
      if (existing) return res.status(409).json({ error: 'User already exists' });
      
      const { data, error } = await supabase.from('users').insert([{ username, email, password: hash }]).select();
      if (error) return res.status(500).json({ error: error.message });
      
      req.session.userId = data[0].id;
      req.session.username = data[0].username;
      return res.json({ success: true, username: data[0].username });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM Users WHERE email=? OR username=?').get(email, username);
    if (existing) return res.status(409).json({ error: 'User already exists' });
    
    const info = db.prepare('INSERT INTO Users (username,email,password) VALUES (?,?,?)').run(username, email, hash);
    req.session.userId = info.lastInsertRowid;
    req.session.username = username;
    res.json({ success: true, username });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (supabase) {
    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    req.session.userId = user.id;
    req.session.username = user.username;
    return res.json({ success: true, username: user.username });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM Users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ success: true, username: user.username });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, username: req.session.username, userId: req.session.userId });
});

// ─── PLAYERS ROUTES ───────────────────────────────────────────────────────────
app.get('/api/players', (req, res) => {
  const db = getDb();
  const { q, country, role } = req.query;
  
  let query = 'SELECT * FROM Players WHERE 1=1';
  const params = [];
  
  if (q) {
    query += ' AND (name LIKE ? OR country LIKE ? OR role LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (country) {
    query += ' AND country = ?';
    params.push(country);
  }
  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  
  query += ' ORDER BY name';
  const players = db.prepare(query).all(params);
  res.json(players);
});

app.get('/api/players/:id', (req, res) => {
  const db = getDb();
  const player = db.prepare('SELECT * FROM Players WHERE id=?').get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  const stats = db.prepare('SELECT * FROM PlayerStats WHERE player_id=?').all(req.params.id);
  res.json({ ...player, stats });
});

// ─── MATCHES ROUTES ───────────────────────────────────────────────────────────
app.get('/api/matches', (req, res) => {
  const db = getDb();
  const matches = db.prepare(`
    SELECT m.*, t.name AS tournament_name
    FROM Matches m
    LEFT JOIN Tournaments t ON m.tournament_id = t.id
    ORDER BY m.id DESC
  `).all();
  res.json(matches);
});

app.get('/api/matches/:id', (req, res) => {
  const db = getDb();
  const match = db.prepare(`
    SELECT m.*, t.name AS tournament_name
    FROM Matches m
    LEFT JOIN Tournaments t ON m.tournament_id = t.id
    WHERE m.id=?
  `).get(req.params.id);
  
  if (!match) return res.status(404).json({ error: 'Match not found' });
  
  if (match.scorecard_json) {
    try {
      match.scorecard = JSON.parse(match.scorecard_json);
    } catch (e) {}
  }
  
  res.json(match);
});

// ─── TOURNAMENTS ROUTES ───────────────────────────────────────────────────────
app.get('/api/tournaments', (req, res) => {
  const db = getDb();
  const tournaments = db.prepare('SELECT * FROM Tournaments ORDER BY year DESC').all();
  res.json(tournaments);
});

app.get('/api/tournaments/:id', (req, res) => {
  const db = getDb();
  const tournament = db.prepare('SELECT * FROM Tournaments WHERE id=?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const topRuns = db.prepare(`
    SELECT p.id as player_id, p.name, p.country, ts.value AS runs, ts.innings, ts.average
    FROM TournamentStats ts JOIN Players p ON ts.player_id=p.id
    WHERE ts.tournament_id=? AND ts.stat_type='runs'
    ORDER BY ts.value DESC LIMIT 5
  `).all(req.params.id);

  const topWickets = db.prepare(`
    SELECT p.id as player_id, p.name, p.country, ts.value AS wickets, ts.innings, ts.average
    FROM TournamentStats ts JOIN Players p ON ts.player_id=p.id
    WHERE ts.tournament_id=? AND ts.stat_type='wickets'
    ORDER BY ts.value DESC LIMIT 5
  `).all(req.params.id);

  const matches = db.prepare(`
    SELECT * FROM Matches
    WHERE tournament_id=?
    ORDER BY id ASC
  `).all(req.params.id);

  res.json({ ...tournament, topRuns, topWickets, matches });
});

// ─── ANALYTICS ROUTES ─────────────────────────────────────────────────────────
app.get('/api/stats/top-batters', (req, res) => {
  const db = getDb();
  const { format } = req.query;
  let query = `
    SELECT p.id, p.name, p.country, p.role,
           SUM(ps.runs)    AS total_runs,
           SUM(ps.matches) AS total_matches,
           MAX(ps.highest_score) AS highest_score,
           ROUND(AVG(NULLIF(ps.average,0)), 2) AS avg_average
    FROM Players p
    JOIN PlayerStats ps ON p.id = ps.player_id
    WHERE 1=1
  `;
  const params = [];
  if (format && format !== 'All') {
    query += ' AND ps.format = ?';
    params.push(format);
  }
  query += ' GROUP BY p.id ORDER BY total_runs DESC LIMIT 10';
  res.json(db.prepare(query).all(params));
});

app.get('/api/stats/top-bowlers', (req, res) => {
  const db = getDb();
  const { format } = req.query;
  let query = `
    SELECT p.id, p.name, p.country, p.role,
           SUM(ps.wickets)  AS total_wickets,
           SUM(ps.matches)  AS total_matches,
           MAX(ps.best_figures) as best_figures,
           ROUND(AVG(NULLIF(ps.bowl_avg,0)), 2) AS avg_bowl_avg
    FROM Players p
    JOIN PlayerStats ps ON p.id = ps.player_id
    WHERE ps.wickets > 0
  `;
  const params = [];
  if (format && format !== 'All') {
    query += ' AND ps.format = ?';
    params.push(format);
  }
  query += ' GROUP BY p.id ORDER BY total_wickets DESC LIMIT 10';
  res.json(db.prepare(query).all(params));
});

// ─── FAVORITES ROUTES ─────────────────────────────────────────────────────────
app.get('/api/favorites', requireAuth, async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('user_favorites').select('*').eq('user_id', req.session.userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  const db = getDb();
  const favs = db.prepare('SELECT * FROM UserFavorites WHERE user_id=?').all(req.session.userId);
  res.json(favs);
});

app.post('/api/favorites', requireAuth, async (req, res) => {
  const { type, ref_id, ref_name } = req.body;
  
  if (supabase) {
    const { data, error } = await supabase.from('user_favorites').upsert({
      user_id: req.session.userId,
      type,
      ref_id,
      ref_name
    }).select();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  }

  const db = getDb();
  console.log('Adding favourite:', { userId: req.session.userId, type, ref_id, ref_name });
  try {
    const info = db.prepare('INSERT OR IGNORE INTO UserFavorites (user_id,type,ref_id,ref_name) VALUES (?,?,?,?)').run(req.session.userId, type, ref_id, ref_name);
    if (info.changes === 0) {
      return res.status(400).json({ error: 'Already in your favourites' });
    }
    res.json({ success: true });
  } catch(e) {
    console.error('Favourite error:', e);
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/favorites', requireAuth, async (req, res) => {
  const { type, ref_id } = req.body;
  
  if (supabase) {
    const { error } = await supabase.from('user_favorites').delete().match({
      user_id: req.session.userId,
      type,
      ref_id
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  const db = getDb();
  db.prepare('DELETE FROM UserFavorites WHERE user_id=? AND type=? AND ref_id=?').run(req.session.userId, type, ref_id);
  res.json({ success: true });
});

// ─── FOR YOU ──────────────────────────────────────────────────────────────────
app.get('/api/foryou', requireAuth, async (req, res) => {
  let favPlayers = [];
  let favTeams = [];

  if (supabase) {
    const { data: pFavs } = await supabase.from('user_favorites').select('*').eq('user_id', req.session.userId).eq('type', 'player');
    const { data: tFavs } = await supabase.from('user_favorites').select('*').eq('user_id', req.session.userId).eq('type', 'team');
    
    // We still need to fetch player details from the local SQLite DB for now 
    // unless the entire Players table is also migrated to Supabase.
    const db = getDb();
    if (pFavs && pFavs.length > 0) {
      const playerIds = pFavs.map(f => f.ref_id);
      const placeholders = playerIds.map(() => '?').join(',');
      favPlayers = db.prepare(`SELECT * FROM Players WHERE id IN (${placeholders})`).all(playerIds);
    }
    favTeams = tFavs || [];
  } else {
    const db = getDb();
    favPlayers = db.prepare(`
      SELECT p.*, uf.ref_name
      FROM UserFavorites uf
      JOIN Players p ON uf.ref_id = p.id
      WHERE uf.user_id=? AND uf.type='player'
    `).all(req.session.userId);
    favTeams = db.prepare('SELECT * FROM UserFavorites WHERE user_id=? AND type=\'team\'').all(req.session.userId);
  }
  
  const db = getDb();
  let stats = [];
  if (favPlayers.length > 0) {
    const playerIds = favPlayers.map(p => p.id);
    const placeholders = playerIds.map(() => '?').join(',');
    stats = db.prepare(`SELECT * FROM PlayerStats WHERE player_id IN (${placeholders})`).all(playerIds);
  }
  
  res.json({ favPlayers, stats, favTeams, username: req.session.username });
});

// ─── CSV IMPORT ───────────────────────────────────────────────────────────────
app.post('/api/import', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { table } = req.body;
  const db = getDb();

  try {
    let rows;
    if (req.file.originalname.endsWith('.csv')) {
      const content = fs.readFileSync(req.file.path, 'utf8');
      rows = parse(content, { columns: true, skip_empty_lines: true });
    } else {
      const wb = XLSX.readFile(req.file.path);
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    }
    fs.unlinkSync(req.file.path);

    let inserted = 0;
    if (table === 'players') {
      const stmt = db.prepare(`INSERT OR REPLACE INTO Players (name,country,role,batting_style,bowling_style,born) VALUES (?,?,?,?,?,?)`);
      const trans = db.transaction((rows) => {
        for (const r of rows) {
          stmt.run(r.name, r.country, r.role, r.batting_style||'', r.bowling_style||'', r.born||'');
          inserted++;
        }
      });
      trans(rows);
    } else if (table === 'matches') {
      const stmt = db.prepare(`INSERT OR REPLACE INTO Matches (team1,team2,date,venue,format,result,score_team1,score_team2,highlights) VALUES (?,?,?,?,?,?,?,?,?)`);
      const trans = db.transaction((rows) => {
        for (const r of rows) {
          stmt.run(r.team1, r.team2, r.date||'', r.venue||'', r.format||'ODI', r.result||'', r.score_team1||'', r.score_team2||'', r.highlights||'');
          inserted++;
        }
      });
      trans(rows);
    }
    res.json({ success: true, inserted });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏏 Cricket Database running at http://localhost:${PORT}`);
});
