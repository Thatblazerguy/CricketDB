-- ======================================================
-- CRICKET DATABASE MANAGEMENT SYSTEM - SQL QUERIES
-- ======================================================

/* 
   SECTION 1: DATABASE SCHEMA (DDL)
   Run these to create the normalized structure of the database.
*/

-- 1. Players Table
CREATE TABLE IF NOT EXISTS Players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    role TEXT,
    batting_style TEXT,
    bowling_style TEXT,
    jersey_number INTEGER
);

-- 2. Player Statistics Table
CREATE TABLE IF NOT EXISTS PlayerStats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    format TEXT NOT NULL CHECK(format IN ('Test','ODI','T20I')),
    matches INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    average REAL DEFAULT 0.0,
    strike_rate REAL DEFAULT 0.0,
    highest_score INTEGER DEFAULT 0,
    hundreds INTEGER DEFAULT 0,
    fifties INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    bowl_avg REAL DEFAULT 0.0,
    best_figures TEXT DEFAULT '-',
    FOREIGN KEY (player_id) REFERENCES Players(id) ON DELETE CASCADE
);

-- 3. Tournaments Table
CREATE TABLE IF NOT EXISTS Tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    year INTEGER,
    format TEXT,
    winner TEXT DEFAULT 'Ongoing'
);

-- 4. Points Table
CREATE TABLE IF NOT EXISTS PointsTable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    team TEXT NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    no_result INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    nrr REAL DEFAULT 0.0,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id)
);

-- 5. Matches Table
CREATE TABLE IF NOT EXISTS Matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    team1 TEXT NOT NULL,
    team2 TEXT NOT NULL,
    date TEXT,
    venue TEXT,
    format TEXT,
    result TEXT,
    score_team1 TEXT,
    score_team2 TEXT,
    highlights TEXT,
    scorecard_json TEXT,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id)
);

-- 6. Tournament Leaderboard Stats
CREATE TABLE IF NOT EXISTS TournamentStats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    stat_type TEXT CHECK(stat_type IN ('runs', 'wickets')),
    value REAL,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(id),
    FOREIGN KEY (player_id) REFERENCES Players(id)
);


-- ======================================================
-- SECTION 2: CORE FEATURE QUERIES (SELECT)
-- These are the queries used by the application logic.
-- ======================================================

.mode column
.headers on

-- FEATURE: FETCH TOP RUN SCORERS (ICC World Cup 2023)
-- Description: Joins TournamentStats with Players to create a leaderboard.
SELECT p.name, p.country, ts.value as runs
FROM TournamentStats ts
JOIN Players p ON ts.player_id = p.id
WHERE ts.tournament_id = 1 AND ts.stat_type = 'runs'
ORDER BY ts.value DESC
LIMIT 5;

-- FEATURE: FETCH TOURNAMENT POINTS TABLE
-- Description: Shows team standings for a specific tournament.
SELECT team, played, won, lost, points, nrr
FROM PointsTable
WHERE tournament_id = 1
ORDER BY points DESC, nrr DESC;

-- FEATURE: PLAYER SEARCH (Case-insensitive)
-- Description: Used in the navbar search bar.
SELECT name, country, role 
FROM Players 
WHERE name LIKE '%Virat%' 
LIMIT 5;

-- FEATURE: PLAYER CAREER STATS (Test Format)
-- Description: Fetches specific format stats for a player profile.
SELECT p.name, ps.matches, ps.runs, ps.average, ps.highest_score, ps.wickets, ps.best_figures
FROM Players p
JOIN PlayerStats ps ON p.id = ps.player_id
WHERE p.name = 'KL Rahul' AND ps.format = 'Test';

-- FEATURE: RECENT MATCHES LIST
-- Description: Displays the match cards on the tournament page.
SELECT team1, team2, result, date, venue
FROM Matches
WHERE tournament_id = 1
ORDER BY id DESC;

-- FEATURE: TOURNAMENT SUMMARY
-- Description: Fetches metadata for the tournament hub.
SELECT name, year, format, winner 
FROM Tournaments 
WHERE id = 1;

-- ======================================================
-- SECTION 3: MANUAL UPDATES (DML)
-- Examples of how to modify data manually.
-- ======================================================

-- Example: Update Highest Score for a player
UPDATE PlayerStats 
SET highest_score = 199 
WHERE format = 'Test' 
AND player_id = (SELECT id FROM Players WHERE name = 'KL Rahul');

-- Example: Update Tournament Winner
UPDATE Tournaments 
SET winner = 'Australia' 
WHERE id = 1;

UPDATE PlayerStats
SET highest_score = 112
WHERE format = 'ODI'
AND player_id = (SELECT id FROM Players WHERE name = 'KL Rahul');


-- ======================================================
-- SECTION 4: DATA ENTRY (INSERT)
-- Examples of how to add new data to the database.
-- ======================================================

-- 1. ADD A NEW PLAYER
-- Use this to add a new cricketer to the database.
INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number)
VALUES ('Shubman Gill', 'India', 'Batter', 'Right-handed', 'Right-arm off-break', 77);

-- 2. ADD CAREER STATISTICS FOR A PLAYER
-- Note: Replace '11' with the actual ID of the player you just inserted.
INSERT INTO PlayerStats (player_id, format, matches, runs, average, strike_rate, hundreds, fifties)
VALUES (11, 'ODI', 44, 2271, 61.37, 103.46, 6, 13);

-- 3. ADD A NEW TOURNAMENT
INSERT INTO Tournaments (name, year, format, winner)
VALUES ('Asia Cup', 2023, 'ODI', 'India');

-- 4. ADD A MATCH TO A TOURNAMENT
-- Note: tournament_id = 5 refers to the Asia Cup inserted above.
INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights)
VALUES (5, 'India', 'Sri Lanka', 'Sept 17, 2023', 'Colombo', 'ODI', 'India won by 10 wickets', '51/10', '51/0', 'Mohammed Siraj took 6 wickets for 21 runs.');

-- 5. UPDATE POINTS TABLE STANDINGS
INSERT INTO PointsTable (tournament_id, team, played, won, lost, points, nrr)
VALUES (1, 'New Zealand', 9, 5, 4, 10, 0.743);

-- ======================================================
-- SECTION 4: DATA ENTRY (INSERT)
-- Examples of how to add new data to the database.
-- ======================================================

-- 1. ADD A NEW PLAYER
-- Use this to add a new cricketer to the database.
INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number)
VALUES ('Shubman Gill', 'India', 'Batter', 'Right-handed', 'Right-arm off-break', 77);

-- 2. ADD CAREER STATISTICS FOR A PLAYER
-- Note: Replace '11' with the actual ID of the player you just inserted.
INSERT INTO PlayerStats (player_id, format, matches, runs, average, strike_rate, hundreds, fifties)
VALUES (11, 'ODI', 44, 2271, 61.37, 103.46, 6, 13);

-- 3. ADD A NEW TOURNAMENT
INSERT INTO Tournaments (name, year, format, winner)
VALUES ('Asia Cup', 2023, 'ODI', 'India');

-- 4. ADD A MATCH TO A TOURNAMENT
-- Note: tournament_id = 5 refers to the Asia Cup inserted above.
INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights)
VALUES (5, 'India', 'Sri Lanka', 'Sept 17, 2023', 'Colombo', 'ODI', 'India won by 10 wickets', '51/10', '51/0', 'Mohammed Siraj took 6 wickets for 21 runs.');

-- 5. ADD A SIMPLE MATCH (Without detailed scorecard)
-- Use this for quick match entry without full player statistics.
INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights)
VALUES (1, 'India', 'Pakistan', '2025-06-15', 'Lords Cricket Ground', 'ODI', 'India won by 5 wickets', '280/9', '278/10', 'Bumrah took 3 wickets');

-- 6. ADD MULTIPLE SIMPLE MATCHES AT ONCE
-- Use this to insert several matches in one query.
INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights)
VALUES 
  (1, 'India', 'Pakistan', '2025-06-15', 'Lords', 'ODI', 'India won by 5 wickets', '280/9', '278/10', 'Great match'),
  (1, 'England', 'West Indies', '2025-06-16', 'Old Trafford', 'ODI', 'England won by 3 runs', '310/8', '307/9', 'Close finish'),
  (4, 'Australia', 'South Africa', '2025-06-17', 'MCG', 'ODI', 'Australia won by 7 wickets', '285/3', '284/10', 'Smith 95');

-- 7. ADD A MATCH WITH MAN OF THE MATCH
-- Use this when you want to highlight the best performer.
INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, man_of_match_name, highlights)
VALUES (1, 'India', 'Sri Lanka', '2025-06-20', 'Colombo', 'ODI', 'India won by 50 runs', '310/6', '260/10', 'Virat Kohli', 'Kohli scored 112');

-- 8. VIEW RECENTLY ADDED MATCHES
-- Check the matches you just added.
SELECT * FROM Matches ORDER BY id DESC LIMIT 5;

-- 9. UPDATE POINTS TABLE STANDINGS
INSERT INTO PointsTable (tournament_id, team, played, won, lost, points, nrr)
VALUES (1, 'New Zealand', 9, 5, 4, 10, 0.743);
