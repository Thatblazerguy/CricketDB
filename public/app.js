/* ══════════════════════════════════════════════
   CRICKET DATABASE — app.js
   ══════════════════════════════════════════════ */

// ─── STATE ────────────────────────────────────
let currentUser = null;
let allPlayers  = [];
let currentFavTab = 'player';
const themeStorageKey = 'cricket-db-theme';

function getSavedTheme() {
  return localStorage.getItem(themeStorageKey);
}

function getPreferredTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  localStorage.setItem(themeStorageKey, nextTheme);
}

function initTheme() {
  const savedTheme = getSavedTheme();
  applyTheme(savedTheme || getPreferredTheme());
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await checkAuth();
  setupSearchEnter();
  navigate('home');
});

// ─── AUTH ─────────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.loggedIn) setLoggedIn(data.username);
    else setLoggedOut();
  } catch { setLoggedOut(); }
}

function updateHeroWelcome(username) {
  const el = document.getElementById('heroWelcomeText');
  if (!el) return;
  if (username) {
    const hour = new Date().getHours();
    let messages = [];

    if (hour >= 5 && hour < 8) {
      messages = [
        `Good morning, ${username}. Ready to start fresh?`,
        `Rise and shine, ${username}.`,
        `Morning, ${username}. Let’s make today count.`,
        `A new day begins, ${username}.`
      ];
    } else if (hour >= 8 && hour < 12) {
      messages = [
        `Good morning, ${username}!`,
        `Hope your day’s off to a great start, ${username}.`,
        `Keep the momentum going, ${username}.`,
        `You’re doing great, ${username}. Keep it up.`
      ];
    } else if (hour >= 12 && hour < 16) {
      messages = [
        `Good afternoon, ${username}!`,
        `Hope your day’s going well, ${username}.`,
        `Stay focused, ${username}. You’re halfway there.`,
        `Keep pushing, ${username}.`
      ];
    } else if (hour >= 16 && hour < 19) {
      messages = [
        `Good evening, ${username}.`,
        `Nice work today, ${username}.`,
        `Hope you had a productive day, ${username}.`,
        `Time to slow things down, ${username}.`
      ];
    } else if (hour >= 19 && hour < 23) {
      messages = [
        `Good evening, ${username}.`,
        `Hope you’re having a relaxing night, ${username}.`,
        `Take it easy, ${username}. You’ve earned it.`,
        `Unwind a bit, ${username}.`
      ];
    } else {
      messages = [
        `Still awake, ${username}?`,
        `Burning the midnight oil, ${username}?`,
        `Don’t forget to rest, ${username}.`,
        `Quiet hours, ${username}. Stay focused.`
      ];
    }
    
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    el.textContent = randomMsg;
  } else {
    el.textContent = 'Cricket Database';
  }
}

function setLoggedIn(username) {
  currentUser = username;
  document.getElementById('authLoggedOut').classList.add('hidden');
  document.getElementById('authLoggedIn').classList.remove('hidden');
  document.getElementById('navUsername').textContent = username;
  document.getElementById('navForYou').classList.remove('hidden');
  updateHeroWelcome(username);
}

function setLoggedOut() {
  currentUser = null;
  document.getElementById('authLoggedOut').classList.remove('hidden');
  document.getElementById('authLoggedIn').classList.add('hidden');
  document.getElementById('navForYou').classList.add('hidden');
  updateHeroWelcome(null);
}

async function doLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  errEl.classList.add('hidden');
  try {
    const res  = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password}) });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.classList.remove('hidden'); return; }
    setLoggedIn(data.username);
    closeModal('loginModal');
    showToast('Welcome back, ' + data.username + '!', 'success');
    navigate('home');
  } catch { errEl.textContent = 'Network error'; errEl.classList.remove('hidden'); }
}

async function doSignup(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value;
  const email    = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const errEl    = document.getElementById('signupError');
  errEl.classList.add('hidden');
  try {
    const res  = await fetch('/api/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,email,password}) });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.classList.remove('hidden'); return; }
    setLoggedIn(data.username);
    closeModal('signupModal');
    showToast('Account created! Welcome, ' + data.username, 'success');
    navigate('home');
  } catch { errEl.textContent = 'Network error'; errEl.classList.remove('hidden'); }
}

async function logout() {
  await fetch('/api/auth/logout', { method:'POST' });
  setLoggedOut();
  navigate('home');
  showToast('Logged out successfully');
}

// ─── NAVIGATION ───────────────────────────────
function navigate(page) {
  // hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // update nav active state
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  const show = (id) => { const el = document.getElementById(id); if (el) el.classList.add('active'); };

  switch (page) {
    case 'home':        show('page-home'); break;
    case 'players':     show('page-players'); loadPlayers(); break;
    case 'matches':     show('page-matches'); loadMatches(); break;
    case 'tournaments': show('page-tournaments'); loadTournaments(); break;
    case 'foryou':
      if (!currentUser) { openModal('loginModal'); return; }
      show('page-foryou'); loadForYou(); break;
    case 'leaderboard': show('page-leaderboard'); loadLeaderboard(); break;
    case 'player-detail':   show('page-player-detail'); break;
    case 'match-detail':    show('page-match-detail'); break;
    case 'tournament-detail': show('page-tournament-detail'); break;
    case 'import':      show('page-import'); break;
    default: show('page-home');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── SEARCH ───────────────────────────────────
function setupSearchEnter() {
  document.getElementById('heroSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
}

function doSearch() {
  const q = document.getElementById('heroSearch').value.trim();
  if (!q) return;
  document.getElementById('playersSearch').value = q;
  document.getElementById('countryFilter').value = '';
  document.getElementById('roleFilter').value = '';
  navigate('players');
  filterPlayers();
}

function filterPlayers() {
  const q = document.getElementById('playersSearch').value.trim();
  const country = document.getElementById('countryFilter').value;
  const role = document.getElementById('roleFilter').value;
  loadPlayers(q, country, role);
}

function applySortPlayers() {
  const sortVal = document.getElementById('sortPlayers').value;
  if (!allPlayers || !allPlayers.length) return;

  const sorted = [...allPlayers];
  if      (sortVal === 'id-asc')   sorted.sort((a, b) => a.id - b.id);
  else if (sortVal === 'id-desc')  sorted.sort((a, b) => b.id - a.id);
  else if (sortVal === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortVal === 'name-desc')sorted.sort((a, b) => b.name.localeCompare(a.name));
  else return;

  const grid = document.getElementById('playersGrid');
  grid.innerHTML = '';
  sorted.forEach(p => grid.appendChild(playerCard(p)));
}

// ─── PLAYERS ──────────────────────────────────
async function loadPlayers(q = '', country = '', role = '') {
  const grid = document.getElementById('playersGrid');
  grid.innerHTML = `<div class="loader"><div class="spinner"></div> Loading players…</div>`;
  try {
    let url = '/api/players?';
    if (q) url += `q=${encodeURIComponent(q)}&`;
    if (country) url += `country=${encodeURIComponent(country)}&`;
    if (role) url += `role=${encodeURIComponent(role)}`;

    const [playersRes] = await Promise.all([
      fetch(url)
    ]);
    allPlayers = await playersRes.json();

    grid.innerHTML = '';
    if (!allPlayers.length) { grid.innerHTML = '<p style="color:var(--muted);padding:2rem">No players found.</p>'; return; }
    allPlayers.forEach(p => grid.appendChild(playerCard(p)));
  } catch(e) { grid.innerHTML = '<p style="color:red;padding:2rem">Failed to load players.</p>'; console.error(e); }
}

async function loadLeaderboard() {
  const format = document.getElementById('leaderboardFormat').value;
  const content = document.getElementById('leaderboardContent');
  content.innerHTML = `<div class="loader"><div class="spinner"></div> Loading rankings…</div>`;
  
  try {
    const [battersRes, bowlersRes] = await Promise.all([
      fetch(`/api/stats/top-batters?format=${format}`),
      fetch(`/api/stats/top-bowlers?format=${format}`)
    ]);
    
    const topBatters = await battersRes.json();
    const topBowlers = await bowlersRes.json();
    
    content.innerHTML = `
      <div>
        <h3 class="section-title" style="font-size:1.1rem;margin-bottom:1rem">🏏 Highest Runs (${format === 'All' ? 'Career' : format})</h3>
        <table class="points-table" style="font-size:0.85rem;width:100%">
          <thead><tr><th>#</th><th>Player</th><th>Country</th><th>Runs</th></tr></thead>
          <tbody>
            ${topBatters.map((b,i) => `
              <tr style="cursor:pointer" onclick="findAndOpenPlayer('${b.name}')">
                <td>${i+1}</td>
                <td><strong style="color:var(--primary)">${b.name}</strong></td>
                <td>${flagEmoji(b.country)} ${b.country}</td>
                <td><strong>${b.total_runs ?? '-'}</strong></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div>
        <h3 class="section-title" style="font-size:1.1rem;margin-bottom:1rem">🎳 Most Wickets (${format === 'All' ? 'Career' : format})</h3>
        <table class="points-table" style="font-size:0.85rem;width:100%">
          <thead><tr><th>#</th><th>Player</th><th>Country</th><th>Wickets</th></tr></thead>
          <tbody>
            ${topBowlers.map((b,i) => `
              <tr style="cursor:pointer" onclick="findAndOpenPlayer('${b.name}')">
                <td>${i+1}</td>
                <td><strong style="color:var(--primary)">${b.name}</strong></td>
                <td>${flagEmoji(b.country)} ${b.country}</td>
                <td><strong>${b.total_wickets ?? '-'}</strong></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    content.innerHTML = '<p style="color:red;padding:2rem">Failed to load leaderboard.</p>';
    console.error(e);
  }
}

function flagEmoji(country) {
  const flags = { India:'🇮🇳', England:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', Australia:'🇦🇺', Pakistan:'🇵🇰', 'New Zealand':'🇳🇿', 'South Africa':'🇿🇦', 'West Indies':'🌴', 'Sri Lanka':'🇱🇰', Bangladesh:'🇧🇩', Afghanistan:'🇦🇫' };
  return flags[country] || '🌍';
}

function jerseyNumber(p) {
  return p.jersey_number ? '#' + p.jersey_number : '#0';
}

function playerCard(p) {
  const div = document.createElement('div');
  div.className = 'player-card';
  div.onclick = () => openPlayerDetail(p.id);
  div.innerHTML = `
    <div style="position:relative">
      <div class="player-avatar jersey-num">${jerseyNumber(p)}</div>
      <span style="position:absolute;top:0;right:0;background:rgba(255,255,255,0.1);color:var(--muted);font-size:0.65rem;padding:2px 6px;border-radius:999px;font-family:monospace">ID #${p.id}</span>
    </div>
    <div class="player-name">${p.name}</div>
    <div class="player-role">${p.role}</div>
    <div class="player-country">${flagEmoji(p.country)} ${p.country}</div>
    <span class="tag">${p.batting_style || 'Right-handed'}</span>
  `;
  return div;
}

async function openPlayerDetail(id) {
  navigate('player-detail');
  const content = document.getElementById('playerDetailContent');
  content.innerHTML = `<div class="loader"><div class="spinner"></div> Loading…</div>`;
  try {
    const res    = await fetch(`/api/players/${id}`);
    const player = await res.json();
    const formats = ['Test','ODI','T20I'];
    const statsMap = {};
    (player.stats || []).forEach(s => { statsMap[s.format] = s; });

    // build fav button if logged in
    const favBtn = currentUser
      ? `<button class="btn-ghost" style="border-color:var(--accent);color:var(--accent)" onclick="togglePlayerFav(${player.id},'${player.name}',this)">☆ Add to Favourites</button>`
      : '';

    content.innerHTML = `
      <div class="detail-hero">
        <div class="detail-avatar jersey-num" style="font-size:1.6rem;font-weight:900;letter-spacing:-1px">${jerseyNumber(player)}</div>
        <div class="detail-info">
          <h2>${player.name}</h2>
          <div class="detail-meta">
            <span class="detail-chip">${flagEmoji(player.country)} ${player.country}</span>
            <span class="detail-chip">${player.role}</span>
            <span class="detail-chip">${player.batting_style || '—'}</span>
            ${player.born ? `<span class="detail-chip">Born: ${player.born}</span>` : ''}
          </div>
          <div style="margin-top:1rem">${favBtn}</div>
        </div>
      </div>
      <div class="tab-group" id="statsTabs">
        ${formats.map((f,i) => `<button class="tab-btn ${i===0?'active':''}" onclick="switchTab('${f}',this,'statsTabs','statsContent')">${f}</button>`).join('')}
      </div>
      <div id="statsContent">
        ${formats.map((f,i) => {
          const s = statsMap[f];
          if (!s) return `<div class="tab-content ${i===0?'active':''}" data-tab="${f}"><p style="color:var(--muted);padding:1.5rem 0">No ${f} data available.</p></div>`;
          const isBowler = s.wickets > 0;
          const isBatter = s.runs > 0;
          return `
            <div class="tab-content ${i===0?'active':''}" data-tab="${f}">
              <div class="stats-section">
                ${isBatter ? `
                  <h3>Batting</h3>
                  <div class="stats-grid">
                    <div class="stat-card"><span class="stat-val">${s.matches}</span><span class="stat-lbl">Matches</span></div>
                    <div class="stat-card"><span class="stat-val">${Math.floor(s.runs).toLocaleString()}</span><span class="stat-lbl">Runs</span></div>
                    <div class="stat-card"><span class="stat-val">${s.average}</span><span class="stat-lbl">Average</span></div>
                    <div class="stat-card"><span class="stat-val">${(s.strike_rate || 0).toFixed(2)}</span><span class="stat-lbl">Strike Rate</span></div>
                    <div class="stat-card"><span class="stat-val">${s.highest_score || '-'}</span><span class="stat-lbl">Highest</span></div>
                    <div class="stat-card"><span class="stat-val">${Math.floor(s.hundreds)}</span><span class="stat-lbl">100s</span></div>
                    <div class="stat-card"><span class="stat-val">${Math.floor(s.fifties)}</span><span class="stat-lbl">50s</span></div>
                  </div>` : ''}
                ${isBowler ? `
                  <h3 style="margin-top:${isBatter?'1.5rem':'0'}">Bowling</h3>
                  <div class="stats-grid">
                    <div class="stat-card"><span class="stat-val">${s.matches}</span><span class="stat-lbl">Matches</span></div>
                    <div class="stat-card"><span class="stat-val">${Math.floor(s.wickets)}</span><span class="stat-lbl">Wickets</span></div>
                    <div class="stat-card"><span class="stat-val">${s.bowl_avg}</span><span class="stat-lbl">Average</span></div>
                    <div class="stat-card"><span class="stat-val">${s.best_figures || '-'}</span><span class="stat-lbl">Best</span></div>
                  </div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>`;
  } catch { content.innerHTML = '<p style="color:red">Failed to load player.</p>'; }
}

async function togglePlayerFav(playerId, playerName, btn) {
  try {
    const res = await fetch('/api/favorites', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'player', ref_id: playerId, ref_name: playerName }) });
    if (res.ok) { btn.textContent = '★ Favourited'; btn.style.background = '#fff8ec'; showToast(playerName + ' added to favourites!', 'success'); }
    else showToast('Already in favourites', 'error');
  } catch { showToast('Error adding favourite', 'error'); }
}

function switchTab(format, btn, tabGroupId, contentId) {
  document.querySelectorAll(`#${tabGroupId} .tab-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll(`#${contentId} .tab-content`).forEach(c => c.classList.remove('active'));
  const target = document.querySelector(`#${contentId} [data-tab="${format}"]`);
  if (target) target.classList.add('active');
}

// ─── MATCHES ──────────────────────────────────
async function loadMatches() {
  const grid = document.getElementById('matchesGrid');
  grid.innerHTML = `<div class="loader"><div class="spinner"></div> Loading matches…</div>`;
  try {
    const res = await fetch('/api/matches');
    const matches = await res.json();
    grid.innerHTML = '';
    if (!matches.length) { grid.innerHTML = '<p style="color:var(--muted);padding:2rem">No matches found.</p>'; return; }
    matches.forEach(m => grid.appendChild(matchCard(m)));
  } catch { grid.innerHTML = '<p style="color:red;padding:2rem">Failed to load matches.</p>'; }
}

function matchCard(m) {
  const div = document.createElement('div');
  div.className = 'match-card';
  div.onclick = () => openMatchDetail(m.id);
  div.innerHTML = `
    <div class="match-teams">
      ${m.team1} <span class="match-vs">vs</span> ${m.team2}
    </div>
    <div class="match-tournament">🏆 ${m.tournament_name || 'International'} · ${m.format || 'ODI'}</div>
    <div class="match-result">✓ ${m.result || 'Result pending'}</div>
    ${m.man_of_match_name ? `<div class="match-mom" style="color:var(--accent);font-weight:600;margin-top:.4rem">⭐ MOM: ${m.man_of_match_name}</div>` : ''}
    <div class="match-date">📅 ${m.date || ''} ${m.venue ? '· ' + m.venue : ''}</div>
  `;
  return div;
}

async function findAndOpenPlayer(name) {
  if (!allPlayers || allPlayers.length === 0) await loadPlayers();
  const cleanName = name.trim().toLowerCase();
  const p = allPlayers.find(pl => pl.name.toLowerCase() === cleanName);
  if (p) openPlayerDetail(p.id);
  else showToast('Player not found in database.', 'error');
}

async function openMatchDetail(id) {
  navigate('match-detail');
  const content = document.getElementById('matchDetailContent');
  content.innerHTML = `<div class="loader"><div class="spinner"></div> Loading…</div>`;
  try {
    const res   = await fetch(`/api/matches/${id}`);
    const match = await res.json();
    
    let scorecardHTML = '';
    if (match.scorecard_json) {
      try {
        const sc = JSON.parse(match.scorecard_json);
        scorecardHTML += `<div style="margin-top: 2.5rem;"><h3 style="font-size:1.3rem;font-weight:700;color:var(--primary);margin-bottom:1rem">Match Scorecard</h3><div class="tab-group" id="scTabs_${match.id}" style="margin-bottom:1.5rem">`;
        Object.keys(sc).forEach((teamKey, idx) => {
          scorecardHTML += `<button class="tab-btn ${idx===0?'active':''}" onclick="switchTab('${teamKey}', this, 'scTabs_${match.id}', 'scContent_${match.id}')">${sc[teamKey].teamName}</button>`;
        });
        scorecardHTML += `</div><div id="scContent_${match.id}">`;
        Object.keys(sc).forEach((teamKey, idx) => {
          const t = sc[teamKey];
          scorecardHTML += `<div class="tab-content ${idx===0?'active':''}" data-tab="${teamKey}">
            <h4 style="margin-bottom:.8rem;color:var(--primary);font-size:1.1rem">Batting</h4>
            <div style="overflow-x:auto">
              <table class="points-table">
                <tr><th>Batter</th><th>Dismissal</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>`;
          t.batting.forEach(b => {
             scorecardHTML += `<tr>
                <td><a href="#" style="color:var(--accent);font-weight:700" onclick="findAndOpenPlayer('${b.player}');return false;">${b.player}</a></td>
                <td style="color:var(--muted)">${b.dismissal}</td>
                <td style="font-weight:700">${b.runs}</td>
                <td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${(b.sr || 0).toFixed(2)}</td>
             </tr>`;
          });
          scorecardHTML += `<tr><td colspan="2"><strong>Extras</strong></td><td colspan="5">${t.extras}</td></tr>`;
          scorecardHTML += `<tr><td colspan="2"><strong>Total</strong></td><td colspan="5" style="font-weight:700">${t.total}</td></tr>`;
          scorecardHTML += `</table>
            </div>`;

          if (t.didNotBat && t.didNotBat.length > 0) {
            scorecardHTML += `<div style="margin-top:1rem;font-size:0.95rem;color:var(--text)">
              <strong>Did not bat: </strong>`;
            const dnbLinks = t.didNotBat.map(name => `<a href="#" style="color:var(--accent);font-weight:600" onclick="findAndOpenPlayer('${name}');return false;">${name}</a>`);
            scorecardHTML += dnbLinks.join(', ');
            scorecardHTML += `</div>`;
          }

          scorecardHTML += `<h4 style="margin-top:2rem;margin-bottom:.8rem;color:var(--primary);font-size:1.1rem">Bowling</h4>
            <div style="overflow-x:auto">
              <table class="points-table">
                <tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ECON</th></tr>`;
          if (t.bowling && Array.isArray(t.bowling)) {
            t.bowling.forEach(b => {
             scorecardHTML += `<tr>
                <td><a href="#" style="color:var(--accent);font-weight:700" onclick="findAndOpenPlayer('${b.player}');return false;">${b.player}</a></td>
                <td>${b.overs}</td>
                <td>${b.maidens}</td>
                <td>${b.runs}</td>
                <td style="font-weight:700">${b.wickets}</td>
                <td>${b.econ}</td>
             </tr>`;
            });
          }
          scorecardHTML += `</table></div></div>`;
        });
        scorecardHTML += `</div></div>`;
      } catch (e) { console.error("Error parsing scorecard", e); }
    }

    content.innerHTML = `
      <div class="detail-hero">
        <div class="match-score-block" style="width:100%">
          <div class="score-team">
            <div class="score-team-name">${match.team1}</div>
            <div class="score-val">${match.score_team1 || '—'}</div>
          </div>
          <div class="score-vs">VS</div>
          <div class="score-team">
            <div class="score-team-name">${match.team2}</div>
            <div class="score-val">${match.score_team2 || '—'}</div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem">
        <div class="stat-card"><span class="stat-val" style="font-size:1rem">${match.tournament_name || '—'}</span><span class="stat-lbl">Tournament</span></div>
        <div class="stat-card"><span class="stat-val" style="font-size:1rem">${match.format || '—'}</span><span class="stat-lbl">Format</span></div>
        <div class="stat-card"><span class="stat-val" style="font-size:1rem">${match.date || '—'}</span><span class="stat-lbl">Date</span></div>
        <div class="stat-card"><span class="stat-val" style="font-size:1rem">${match.venue || '—'}</span><span class="stat-lbl">Venue</span></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem">
        <div class="stat-card" style="text-align:left;padding:1rem 1.25rem">
          <span class="stat-lbl">Result</span>
          <div style="font-size:1.05rem;font-weight:700;color:#16a34a;margin-top:.3rem">${match.result || '—'}</div>
        </div>
        ${match.man_of_match_name ? `<div class="stat-card" style="text-align:left;padding:1rem 1.25rem;background:linear-gradient(135deg,#fbbf24,#f59e0b)">
          <span class="stat-lbl" style="color:rgba(0,0,0,0.7)">Man of the Match</span>
          <div style="font-size:1.05rem;font-weight:700;color:rgba(0,0,0,0.9);margin-top:.3rem;cursor:pointer" onclick="findAndOpenPlayer('${match.man_of_match_name}');return false">⭐ ${match.man_of_match_name}</div>
        </div>` : ''}
      </div>
      ${match.highlights ? `<div class="highlight-box"><strong>🎯 Key Highlights</strong><br/><br/>${match.highlights}</div>` : ''}
      ${scorecardHTML}
    `;
  } catch { content.innerHTML = '<p style="color:red">Failed to load match.</p>'; }
}

// ─── TOURNAMENTS ──────────────────────────────
async function loadTournaments() {
  const grid = document.getElementById('tournamentsGrid');
  grid.innerHTML = `<div class="loader"><div class="spinner"></div> Loading tournaments…</div>`;
  try {
    const res = await fetch('/api/tournaments');
    const tournaments = await res.json();
    grid.innerHTML = '';
    if (!tournaments.length) { grid.innerHTML = '<p style="color:var(--muted);padding:2rem">No tournaments found.</p>'; return; }
    tournaments.forEach(t => grid.appendChild(tournamentCard(t)));
  } catch { grid.innerHTML = '<p style="color:red;padding:2rem">Failed to load tournaments.</p>'; }
}

function tournamentCard(t) {
  const icons = { ODI:'🏆', T20I:'⚡', Test:'🎖️' };
  const div = document.createElement('div');
  div.className = 'tournament-card';
  div.onclick = () => openTournamentDetail(t.id);
  div.innerHTML = `
    <div class="tournament-icon">${icons[t.format] || '🏆'}</div>
    <div class="tournament-name">${t.name}</div>
    <div class="tournament-meta">${t.year} · ${t.format} · ${t.host_country || ''}</div>
    ${t.winner ? `<div class="tournament-winner">🥇 ${t.winner}</div>` : ''}
    <p style="font-size:.82rem;color:var(--muted);margin-top:.6rem;line-height:1.5">${t.description || ''}</p>
  `;
  return div;
}

async function openTournamentDetail(id) {
  navigate('tournament-detail');
  const content = document.getElementById('tournamentDetailContent');
  content.innerHTML = `<div class="loader"><div class="spinner"></div> Loading…</div>`;
  try {
    const res  = await fetch(`/api/tournaments/${id}`);
    const data = await res.json();


    const runsRows = (data.topRuns || []).map(r => `
      <tr>
        <td><a href="#" style="color:var(--accent);font-weight:600" onclick="findAndOpenPlayer('${r.name}');return false;">${flagEmoji(r.country)} ${r.name}</a></td>
        <td>${r.innings || '-'}</td>
        <td><strong style="color:var(--primary)">${Math.floor(r.runs || 0)}</strong></td>
        <td>${r.average ? Number(r.average).toFixed(2) : '—'}</td>
      </tr>`).join('');

    const wicketRows = (data.topWickets || []).map(r => `
      <tr>
        <td><a href="#" style="color:var(--accent);font-weight:600" onclick="findAndOpenPlayer('${r.name}');return false;">${flagEmoji(r.country)} ${r.name}</a></td>
        <td>${r.innings || '-'}</td>
        <td><strong style="color:var(--primary)">${Math.floor(r.wickets || 0)}</strong></td>
        <td>${r.average ? Number(r.average).toFixed(2) : '—'}</td>
      </tr>`).join('');

    content.innerHTML = `
      <div class="detail-hero">
        <div class="detail-avatar">🏆</div>
        <div class="detail-info">
          <h2>${data.name}</h2>
          <div class="detail-meta">
            <span class="detail-chip">${data.year}</span>
            <span class="detail-chip">${data.format}</span>
            ${data.host_country ? `<span class="detail-chip">🌍 ${data.host_country}</span>` : ''}
            ${data.winner ? `<span class="detail-chip">🥇 ${data.winner}</span>` : ''}
          </div>
          ${data.description ? `<p style="color:rgba(255,255,255,.65);margin-top:.75rem;font-size:.9rem">${data.description}</p>` : ''}
        </div>
      </div>


      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:1.5rem">
        ${runsRows ? `
        <div>
          <h3 class="section-title" style="font-size:1.1rem;margin-bottom:1rem">🏏 Top Run Scorers</h3>
          <table class="points-table" style="font-size:0.9rem">
            <thead><tr><th>Player</th><th>Innings</th><th>Runs</th><th>Average</th></tr></thead>
            <tbody>${runsRows}</tbody>
          </table>
        </div>` : ''}
        ${wicketRows ? `
        <div>
          <h3 class="section-title" style="font-size:1.1rem;margin-bottom:1rem">🎳 Top Wicket Takers</h3>
          <table class="points-table" style="font-size:0.9rem">
            <thead><tr><th>Player</th><th>Innings</th><th>Wickets</th><th>Average</th></tr></thead>
            <tbody>${wicketRows}</tbody>
          </table>
        </div>` : ''}
      </div>

      ${data.matches && data.matches.length ? `
      <div style="margin-top:2.5rem">
        <h3 class="section-title" style="font-size:1.2rem;margin-bottom:1.5rem">📅 Tournament Matches</h3>
        <div class="cards-grid">
          ${data.matches.map(m => `
            <div class="match-card" onclick="openMatchDetail(${m.id})">
              <div class="match-teams">
                <div style="display:flex;justify-content:space-between;width:100%">
                  <span>${m.team1}</span>
                  <span style="font-weight:700;color:var(--primary)">${m.score_team1 || ''}</span>
                </div>
                <div style="display:flex;justify-content:space-between;width:100%;margin-top:0.3rem">
                  <span>${m.team2}</span>
                  <span style="font-weight:700;color:var(--primary)">${m.score_team2 || ''}</span>
                </div>
              </div>
              <div class="match-result" style="margin-top:0.8rem;border-top:1px solid rgba(255,255,255,0.05);padding-top:0.5rem">✓ ${m.result || 'Result pending'}</div>
              ${m.man_of_match_name ? `<div class="match-mom" style="color:var(--accent);font-weight:600;margin-top:.4rem;font-size:0.8rem">⭐ MOM: ${m.man_of_match_name}</div>` : ''}
              <div class="match-date" style="margin-top:0.3rem;font-size:0.75rem;opacity:0.8">📅 ${m.date || ''} ${m.venue ? '· ' + m.venue : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      </div>
    `;
  } catch { content.innerHTML = '<p style="color:red">Failed to load tournament.</p>'; }
}

// ─── FOR YOU ──────────────────────────────────
async function loadForYou() {
  const content = document.getElementById('foryouContent');
  document.getElementById('foryouTitle').textContent = 'For You';
  content.innerHTML = `<div class="loader"><div class="spinner"></div> Loading your dashboard…</div>`;
  try {
    const res  = await fetch('/api/foryou');
    if (!res.ok) { content.innerHTML = '<p style="color:red">Please log in to view this page.</p>'; return; }
    const data = await res.json();

    document.getElementById('foryouTitle').textContent = `For You, ${data.username} 👋`;

    const statsMap = {};
    (data.stats || []).forEach(s => {
      if (!statsMap[s.player_id]) statsMap[s.player_id] = {};
      statsMap[s.player_id][s.format] = s;
    });

    if (!data.favPlayers.length && !data.favTeams.length) {
      content.innerHTML = `
        <div class="foryou-empty">
          <div class="foryou-icon">🏏</div>
          <p>You haven't added any favourites yet.</p>
          <p style="margin-top:.5rem">Click <strong>"+ Add Favourite"</strong> to get started.</p>
        </div>`;
      return;
    }

    let html = '';

    if (data.favPlayers.length) {
      html += `<div class="foryou-section"><h2>⭐ Favourite Players</h2><div style="display:flex;flex-direction:column;gap:1rem">`;
      data.favPlayers.forEach(p => {
        const ps = statsMap[p.id] || {};
        const formats = ['Test','ODI','T20I'];
        const tabId = 'ptab_' + p.id;
        const contentId = 'pcontent_' + p.id;
        html += `
          <div class="fav-player-card">
            <div class="player-avatar jersey-num" style="width:48px;height:48px;font-size:.85rem;flex-shrink:0">${jerseyNumber(p)}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem">
                <span style="font-weight:700;color:var(--primary)">${p.name}</span>
                <span style="font-size:.75rem;color:var(--muted)">${flagEmoji(p.country)} ${p.country}</span>
              </div>
              <div style="font-size:.8rem;color:var(--accent);font-weight:600;margin-bottom:.75rem">${p.role}</div>
              <div class="tab-group" id="${tabId}" style="margin-bottom:.75rem">
                ${formats.map((f,i) => `<button class="tab-btn ${i===0?'active':''}" style="padding:.3rem .7rem;font-size:.78rem" onclick="switchTab('${f}',this,'${tabId}','${contentId}')">${f}</button>`).join('')}
              </div>
              <div id="${contentId}">
                ${formats.map((f,i) => {
                  const s = ps[f];
                  if (!s) return `<div class="tab-content ${i===0?'active':''}" data-tab="${f}"><span style="font-size:.82rem;color:var(--muted)">No data</span></div>`;
                  return `<div class="tab-content ${i===0?'active':''}" data-tab="${f}">
                    <div style="display:flex;gap:.75rem;flex-wrap:wrap">
                      ${s.matches ? `<div class="stat-card" style="padding:.5rem .75rem;min-width:70px"><span class="stat-val" style="font-size:1.1rem">${s.matches}</span><span class="stat-lbl">Mat</span></div>` : ''}
                      ${s.runs ? `<div class="stat-card" style="padding:.5rem .75rem;min-width:70px"><span class="stat-val" style="font-size:1.1rem">${s.runs}</span><span class="stat-lbl">Runs</span></div>` : ''}
                      ${s.average ? `<div class="stat-card" style="padding:.5rem .75rem;min-width:70px"><span class="stat-val" style="font-size:1.1rem">${s.average}</span><span class="stat-lbl">Avg</span></div>` : ''}
                      ${s.wickets ? `<div class="stat-card" style="padding:.5rem .75rem;min-width:70px"><span class="stat-val" style="font-size:1.1rem">${s.wickets}</span><span class="stat-lbl">Wkts</span></div>` : ''}
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>
            <button class="fav-remove" onclick="removeFav('player',${p.id},this)">Remove</button>
          </div>`;
      });
      html += '</div></div>';
    }

    if (data.favTeams.length) {
      html += `<div class="foryou-section"><h2>🏟️ Favourite Teams</h2><div style="display:flex;gap:.75rem;flex-wrap:wrap">`;
      data.favTeams.forEach(t => {
        html += `
          <div style="background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:1rem 1.25rem;display:flex;align-items:center;gap:1rem">
            <span style="font-size:1.5rem">${flagEmoji(t.ref_name)}</span>
            <span style="font-weight:600;color:var(--primary)">${t.ref_name}</span>
            <button class="fav-remove" onclick="removeFav('team',${t.ref_id},this)">Remove</button>
          </div>`;
      });
      html += '</div></div>';
    }

    content.innerHTML = html;
    await populateFavPlayerSelect();
  } catch(e) { content.innerHTML = '<p style="color:red">Error loading your page: ' + e.message + '</p>'; }
}

async function removeFav(type, refId, btn) {
  try {
    await fetch('/api/favorites', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, ref_id: refId }) });
    showToast('Removed from favourites');
    loadForYou();
  } catch { showToast('Error removing favourite', 'error'); }
}

// ─── ADD FAVOURITE MODAL ──────────────────────
async function populateFavPlayerSelect() {
  const sel = document.getElementById('favPlayerSelect');
  if (!sel) return;
  if (!allPlayers.length) {
    const res = await fetch('/api/players');
    allPlayers = await res.json();
  }
  sel.innerHTML = allPlayers.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name} (${p.country})</option>`).join('');
}

function switchFavTab(tab, btn) {
  currentFavTab = tab;
  document.querySelectorAll('#addFavModal .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('favPlayerTab').classList.toggle('hidden', tab !== 'player');
  document.getElementById('favTeamTab').classList.toggle('hidden', tab !== 'team');
}

async function addFavourite() {
  if (!currentUser) { closeModal('addFavModal'); openModal('loginModal'); return; }
  try {
    let body;
    if (currentFavTab === 'player') {
      const sel = document.getElementById('favPlayerSelect');
      const playerId = sel.value;
      const playerName = sel.options[sel.selectedIndex].dataset.name;
      body = { type:'player', ref_id: parseInt(playerId), ref_name: playerName };
    } else {
      const teamName = document.getElementById('favTeamInput').value.trim();
      if (!teamName) { showToast('Enter a team name', 'error'); return; }
      body = { type:'team', ref_id: null, ref_name: teamName };
    }
    const res = await fetch('/api/favorites', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (res.ok) { showToast('Added to favourites!', 'success'); closeModal('addFavModal'); loadForYou(); }
    else showToast('Already in favourites or error', 'error');
  } catch { showToast('Error adding favourite', 'error'); }
}

// ─── IMPORT ───────────────────────────────────
async function doImport() {
  const file    = document.getElementById('importFile').files[0];
  const table   = document.getElementById('importTable').value;
  const resultEl = document.getElementById('importResult');
  if (!file) { showToast('Please select a file', 'error'); return; }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('table', table);

  resultEl.className = 'import-result';
  resultEl.textContent = 'Uploading…';
  resultEl.classList.remove('hidden');

  try {
    const res  = await fetch('/api/import', { method:'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
      resultEl.classList.add('success');
      resultEl.textContent = `✅ Successfully imported ${data.inserted} records into ${table}.`;
    } else {
      resultEl.classList.add('error');
      resultEl.textContent = '❌ ' + data.error;
    }
  } catch(e) {
    resultEl.classList.add('error');
    resultEl.textContent = '❌ Network error: ' + e.message;
  }
}

// ─── MODAL HELPERS ────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  if (id === 'addFavModal') populateFavPlayerSelect();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function closeModalOutside(e, id) {
  if (e.target.id === id) closeModal(id);
}

function switchModal(closeId, openId) {
  closeModal(closeId);
  openModal(openId);
}

// ─── TOAST ────────────────────────────────────
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}
