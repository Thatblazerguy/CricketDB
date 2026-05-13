# Cricket Database Management System

---

## Part 1: Database Schema

### 1. Players

```sql
CREATE TABLE Players (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    country       TEXT    NOT NULL,
    role          TEXT    NOT NULL CHECK(role IN ('Batsman','Bowler','All-rounder','Wicket-keeper')),
    batting_style TEXT,
    bowling_style TEXT,
    jersey_number INTEGER
);
```

### 2. Tournaments

```sql
CREATE TABLE Tournaments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    year         INTEGER NOT NULL,
    format       TEXT    NOT NULL CHECK(format IN ('Test','ODI','T20I')),
    host_country TEXT,
    winner       TEXT,
    UNIQUE (name, year)
);
```

### 3. Matches

```sql
-- Matches reference Tournaments via tournament_id (FK → Tournaments.id)
CREATE TABLE Matches (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id   INTEGER NOT NULL,
    team1           TEXT    NOT NULL,
    team2           TEXT    NOT NULL,
    date            TEXT    NOT NULL,
    venue           TEXT    NOT NULL,
    format          TEXT    NOT NULL CHECK(format IN ('Test','ODI','T20I')),
    score_team1     TEXT,
    score_team2     TEXT,
    result          TEXT,
    man_of_match    TEXT,
    highlights      TEXT,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id) ON DELETE CASCADE
);
```

### 4. PlayerStats (Career Stats per Format)

```sql
-- Aggregate career stats per player per format
CREATE TABLE PlayerStats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id   INTEGER NOT NULL,
    format      TEXT    NOT NULL CHECK(format IN ('Test','ODI','T20I')),
    matches     INTEGER DEFAULT 0,
    innings     INTEGER DEFAULT 0,
    runs        INTEGER DEFAULT 0,
    average     REAL    DEFAULT 0.0,
    strike_rate REAL    DEFAULT 0.0,
    hundreds    INTEGER DEFAULT 0,
    fifties     INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    wickets     INTEGER DEFAULT 0,
    bowl_avg    REAL    DEFAULT 0.0,
    best_figures TEXT   DEFAULT '-',
    FOREIGN KEY (player_id) REFERENCES Players(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_stats_unique ON PlayerStats(player_id, format);
```

### 5. MatchPerformances (Per-Match Scorecard)

```sql
-- Individual player performance in each match
CREATE TABLE MatchPerformances (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id      INTEGER NOT NULL,
    player_id     INTEGER,
    player_name   TEXT    NOT NULL,
    country       TEXT    NOT NULL,
    role          TEXT    NOT NULL,
    runs          INTEGER DEFAULT 0,
    balls         INTEGER DEFAULT 0,
    fours         INTEGER DEFAULT 0,
    sixes         INTEGER DEFAULT 0,
    dismissal     TEXT,
    overs         REAL    DEFAULT 0,
    maidens       INTEGER DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    wickets       INTEGER DEFAULT 0,
    economy       REAL    DEFAULT 0,
    FOREIGN KEY (match_id)  REFERENCES Matches(id)  ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES Players(id)
);
```

---

## Part 2: Insertion Queries

### Players

```sql
INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number)
VALUES ('Virat Kohli',    'India',     'Batsman',    'Right-handed', NULL,              18);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number)
VALUES ('Jasprit Bumrah', 'India',     'Bowler',     'Right-handed', 'Right-arm fast',  93);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number)
VALUES ('Rohit Sharma',   'India',     'Batsman',    'Right-handed', NULL,              45);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number)
VALUES ('Pat Cummins',    'Australia', 'Bowler',     'Right-handed', 'Right-arm fast',  30);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number)
VALUES ('Travis Head',    'Australia', 'All-rounder','Left-handed',  'Right-arm off-break', 20);
```

### Tournaments

```sql
INSERT OR IGNORE INTO Tournaments (name, year, format, host_country, winner)
VALUES ('ICC ODI World Cup', 2023, 'ODI', 'India', 'Australia');

INSERT OR IGNORE INTO Tournaments (name, year, format, host_country, winner)
VALUES ('Border Gavaskar Trophy', 2024, 'Test', 'Australia', 'India');
```

### Matches (linked via subquery — no hardcoded IDs)

```sql
INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, score_team1, score_team2, result, man_of_match_name, highlights)
SELECT id, 'India', 'Pakistan', '14-Oct-2023', 'Narendra Modi Stadium, Ahmedabad', 'ODI',
       '192/3 (30.3 ov)', '191/10 (42.5 ov)', 'India won by 7 wickets', 'Jasprit Bumrah', 'Bumrah 2/19'
FROM Tournaments WHERE name='ICC Cricket World Cup' AND year=2023
AND NOT EXISTS (SELECT 1 FROM Matches WHERE team1='India' AND team2='Pakistan' AND date='14-Oct-2023');

INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, score_team1, score_team2, result, man_of_match_name, highlights)
SELECT id, 'Australia', 'India', '22-Nov-2024', 'Optus Stadium, Perth', 'Test',
       '104 & 238', '150 & 487/6d', 'India won by 295 runs', 'Jasprit Bumrah', 'Bumrah 5/30, Jaiswal 161'
FROM Tournaments WHERE name='Border Gavaskar Trophy' AND year=2024
AND NOT EXISTS (SELECT 1 FROM Matches WHERE team1='Australia' AND team2='India' AND date='22-Nov-2024');
```

### PlayerStats (Career stats per format)

```sql
-- Virat Kohli ODI stats
INSERT INTO PlayerStats (player_id, format, matches, innings, runs, average, strike_rate, hundreds, fifties, highest_score, wickets)
VALUES (1, 'ODI', 295, 285, 13906, 58.18, 93.2, 50, 68, 183, 4);

-- Jasprit Bumrah ODI stats
INSERT INTO PlayerStats (player_id, format, matches, innings, runs, average, strike_rate, hundreds, fifties, highest_score, wickets, bowl_avg, best_figures)
VALUES (2, 'ODI', 90, 0, 0, 0, 0, 0, 0, 0, 149, 24.5, '5/27');
```

### MatchPerformances (Per-match scorecard entry)

```sql
-- India vs Pakistan: Bumrah bowling
INSERT INTO MatchPerformances (match_id, player_id, player_name, country, role, runs, balls, overs, runs_conceded, wickets, economy)
VALUES (1, 2, 'Jasprit Bumrah', 'India', 'Bowler', 4, 8, 7, 19, 2, 2.71);

-- India vs Pakistan: Rohit Sharma batting
INSERT INTO MatchPerformances (match_id, player_id, player_name, country, role, runs, balls, fours, sixes, dismissal)
VALUES (1, 3, 'Rohit Sharma', 'India', 'Batsman', 86, 63, 7, 4, 'caught');
```

---

## Part 3: Core Retrieval Queries

```sql
-- Player details by id
SELECT * FROM Players WHERE id = 1;

-- Player details by name
SELECT * FROM Players WHERE name = 'Virat Kohli';

-- All players from a country
SELECT * FROM Players WHERE country = 'India' ORDER BY name;

-- Match details by id (with tournament name)
SELECT m.*, t.name AS tournament_name
FROM Matches m
LEFT JOIN Tournaments t ON m.tournament_id = t.id
WHERE m.id = 1;

-- Tournament details by id
SELECT * FROM Tournaments WHERE id = 1;

-- All matches (with tournament name)
SELECT m.*, t.name AS tournament_name
FROM Matches m
LEFT JOIN Tournaments t ON m.tournament_id = t.id
ORDER BY m.id DESC;

-- All tournaments
SELECT * FROM Tournaments ORDER BY year DESC;
```

---

## Part 4: Performance & Analytics Queries

```sql
-- Career Leaderboard (All Formats: ODI + Test + T20I)
SELECT p.name, p.country,
       SUM(ps.runs) AS total_runs
FROM Players p
JOIN PlayerStats ps ON p.id = ps.player_id
GROUP BY p.id
ORDER BY total_runs DESC
LIMIT 10;

-- Top 10 batters (Format: ODI)
SELECT p.name, p.country,
       SUM(ps.runs) AS total_runs
FROM Players p
JOIN PlayerStats ps ON p.id = ps.player_id
WHERE ps.format = 'ODI'
GROUP BY p.id
ORDER BY total_runs DESC
LIMIT 10;

-- Top 10 bowlers (Format: Test)
SELECT p.name, p.country,
       SUM(ps.wickets) AS total_wickets
FROM Players p
JOIN PlayerStats ps ON p.id = ps.player_id
WHERE ps.format = 'Test'
GROUP BY p.id
ORDER BY total_wickets DESC
LIMIT 10;

-- All matches played by a specific team
SELECT m.*, t.name AS tournament_name
FROM Matches m
LEFT JOIN Tournaments t ON m.tournament_id = t.id
WHERE m.team1 = 'India' OR m.team2 = 'India'
ORDER BY m.date DESC;

-- Players by average strike rate (ODI)
SELECT p.name, p.country, ps.strike_rate, ps.average, ps.runs
FROM Players p
JOIN PlayerStats ps ON p.id = ps.player_id
WHERE ps.format = 'ODI'
ORDER BY ps.strike_rate DESC;

-- Update player stats (e.g. KL Rahul ODI highest score)
UPDATE PlayerStats
SET highest_score = 112
WHERE format = 'ODI'
AND player_id = (SELECT id FROM Players WHERE name = 'KL Rahul');
```

---

## Part 5: JOIN Queries

```sql
-- Full player career stats: Player + PlayerStats (all formats)
SELECT p.name, p.country, ps.format,
       ps.matches, ps.runs, ps.average, ps.strike_rate,
       ps.hundreds, ps.fifties, ps.highest_score,
       ps.wickets, ps.bowl_avg, ps.best_figures
FROM Players p
JOIN PlayerStats ps ON p.id = ps.player_id
ORDER BY p.name, ps.format;

-- Full match scorecard: MatchPerformances + Players + Matches
SELECT m.team1, m.team2, m.date, m.venue,
       mp.player_name, mp.country, mp.role,
       mp.runs, mp.balls, mp.fours, mp.sixes, mp.dismissal,
       mp.overs, mp.wickets, mp.economy
FROM Matches m
JOIN MatchPerformances mp ON m.id = mp.match_id
WHERE m.id = 1
ORDER BY mp.role DESC, mp.runs DESC;

-- Tournament + all its matches
SELECT t.name AS tournament, t.year, t.format,
       m.team1, m.team2, m.date, m.venue,
       m.score_team1, m.score_team2, m.result
FROM Tournaments t
JOIN Matches m ON t.id = m.tournament_id
ORDER BY t.year, m.date;
```

---

## Part 6: API Endpoints (Live on Frontend)

| Endpoint | Method | Description | Frontend Location |
|---|---|---|---|
| `/api/players` | GET | All players (filter: `?q=`, `?country=`, `?role=`) | Players Tab |
| `/api/players/:id` | GET | Player detail + career stats | Player Profile |
| `/api/matches` | GET | All matches with tournament name | Matches Tab |
| `/api/matches/:id` | GET | Match detail + scorecard | Match Detail |
| `/api/tournaments` | GET | All tournaments | Tournaments Tab |
| `/api/tournaments/:id` | GET | Tournament detail + points + matches | Tournament Detail |
| `/api/stats/top-batters` | GET | Top 10 batters (filter: `?format=ODI`) | Leaderboard Tab |
| `/api/stats/top-bowlers` | GET | Top 10 bowlers (filter: `?format=ODI`) | Leaderboard Tab |
| `/api/stats/team-matches` | GET | Matches by team `?team=India` | Accessible via API |
| `/api/stats/players-by-country` | GET | Players by country `?country=India` | Accessible via API |

---

## Part 7: Mini Report

This Cricket DBMS tracks international cricket data across Test, ODI, and T20I formats. It is built on a normalized relational schema with five core tables: **Players**, **Tournaments**, **Matches**, **PlayerStats**, and **MatchPerformances**.

**Table Relationships:**
- `Matches` → `Tournaments` (many-to-one via `tournament_id`)
- `PlayerStats` → `Players` (one-to-many; one row per format per player)
- `MatchPerformances` → `Matches` and `Players` (many-to-many bridge)

**Why Normalization:** Player and tournament details are stored once and referenced via foreign keys — eliminating update anomalies. Unique indexes on `(Tournaments.name, year)` and `(Matches.team1, team2, date)` enforce data integrity at the database level.

**Key Assumptions:**
- Every match belongs to exactly one tournament.
- `PlayerStats` stores cumulative career totals per format, not per-match data.
- `MatchPerformances` stores per-match innings/bowling figures for scorecards.
- Matches are inserted using name-based subqueries (never hardcoded IDs) to prevent broken FK links after resets.
- `ON DELETE CASCADE` ensures orphaned child records are cleaned automatically.
