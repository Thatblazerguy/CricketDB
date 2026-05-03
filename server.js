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
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const isSupabaseConfigured = supabaseUrl && supabaseKey && !supabaseUrl.includes('your-supabase-url');
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Initialise DB (creates + seeds on first run)
require('./db/init');
const { getDb } = require('./db/database');

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
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  
  const hash = bcrypt.hashSync(password, 10);

  if (supabase) {
    const { data: existing } = await supabase.from('users').select('id').or(`email.eq.${email},username.eq.${username}`).maybeSingle();
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
  const players = db.prepare(query).all(...params);
  
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
  
  // Fetch match performances if they exist
  const performances = db.prepare(`
    SELECT mp.*, p.id as player_db_id
    FROM MatchPerformances mp
    LEFT JOIN Players p ON mp.player_id = p.id
    WHERE mp.match_id = ?
    ORDER BY mp.player_name
  `).all(req.params.id);
  
  match.performances = performances || [];
  
  // Parse scorecard JSON if it exists
  if (match.scorecard_json) {
    try {
      match.scorecard = JSON.parse(match.scorecard_json);
    } catch (e) {
      // Ignore if not valid JSON
    }
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

  const points = db.prepare('SELECT * FROM PointsTable WHERE tournament_id=? ORDER BY points DESC, nrr DESC').all(req.params.id);
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

  res.json({ ...tournament, points, topRuns, topWickets, matches });
});

// ─── FAVORITES ROUTES ─────────────────────────────────────────────────────────
app.get('/api/favorites', requireAuth, async (req, res) => {
  if (supabase) {
    const { data: favs } = await supabase.from('user_favorites').select('*').eq('user_id', req.session.userId);
    return res.json(favs || []);
  }
  const db = getDb();
  const favs = db.prepare('SELECT * FROM UserFavorites WHERE user_id=?').all(req.session.userId);
  res.json(favs);
});

app.post('/api/favorites', requireAuth, async (req, res) => {
  const { type, ref_id, ref_name } = req.body;
  
  if (supabase) {
    const { error } = await supabase.from('user_favorites').insert([{ user_id: req.session.userId, type, ref_id, ref_name }]);
    if (error && error.code !== '23505') return res.status(400).json({ error: error.message }); // 23505 is unique violation
    return res.json({ success: true });
  }

  const db = getDb();
  try {
    db.prepare('INSERT OR IGNORE INTO UserFavorites (user_id,type,ref_id,ref_name) VALUES (?,?,?,?)').run(req.session.userId, type, ref_id, ref_name);
    res.json({ success: true });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/favorites', requireAuth, async (req, res) => {
  const { type, ref_id } = req.body;
  
  if (supabase) {
    await supabase.from('user_favorites').delete().match({ user_id: req.session.userId, type, ref_id });
    return res.json({ success: true });
  }

  const db = getDb();
  db.prepare('DELETE FROM UserFavorites WHERE user_id=? AND type=? AND ref_id=?').run(req.session.userId, type, ref_id);
  res.json({ success: true });
});

// ─── FOR YOU (personalized) ───────────────────────────────────────────────────
app.get('/api/foryou', requireAuth, async (req, res) => {
  const db = getDb();
  let favPlayers = [];
  let favTeams = [];
  
  if (supabase) {
    const { data: favs } = await supabase.from('user_favorites').select('*').eq('user_id', req.session.userId);
    if (favs) {
      favTeams = favs.filter(f => f.type === 'team');
      const playerFavs = favs.filter(f => f.type === 'player');
      if (playerFavs.length > 0) {
        const playerIds = playerFavs.map(f => f.ref_id);
        const placeholders = playerIds.map(() => '?').join(',');
        const dbPlayers = db.prepare(`SELECT * FROM Players WHERE id IN (${placeholders})`).all(...playerIds);
        favPlayers = dbPlayers.map(p => {
            const f = playerFavs.find(fav => fav.ref_id === p.id);
            return { ...p, ref_name: f ? f.ref_name : null };
        });
      }
    }
  } else {
    favPlayers = db.prepare(`
      SELECT p.*, uf.ref_name
      FROM UserFavorites uf
      JOIN Players p ON uf.ref_id = p.id
      WHERE uf.user_id=? AND uf.type='player'
    `).all(req.session.userId);
    favTeams = db.prepare(`SELECT * FROM UserFavorites WHERE user_id=? AND type='team'`).all(req.session.userId);
  }

  const playerIds = favPlayers.map(p => p.id);
  let stats = [];
  if (playerIds.length > 0) {
    const placeholders = playerIds.map(() => '?').join(',');
    stats = db.prepare(`SELECT * FROM PlayerStats WHERE player_id IN (${placeholders})`).all(...playerIds);
  }

  res.json({ favPlayers, stats, favTeams, username: req.session.username });
});

// ─── CSV/EXCEL IMPORT ─────────────────────────────────────────────────────────
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
      const tx = db.transaction(() => { rows.forEach(r => { stmt.run(r.name,r.country,r.role,r.batting_style||'',r.bowling_style||'',r.born||''); inserted++; }); });
      tx();
    } else if (table === 'matches') {
      const stmt = db.prepare(`INSERT OR REPLACE INTO Matches (team1,team2,date,venue,format,result,score_team1,score_team2,highlights) VALUES (?,?,?,?,?,?,?,?,?)`);
      const tx = db.transaction(() => { rows.forEach(r => { stmt.run(r.team1,r.team2,r.date||'',r.venue||'',r.format||'ODI',r.result||'',r.score_team1||'',r.score_team2||'',r.highlights||''); inserted++; }); });
      tx();
    }

    res.json({ success: true, inserted });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── SPA FALLBACK ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🏏 Cricket Database running at http://localhost:${PORT}`);
});
