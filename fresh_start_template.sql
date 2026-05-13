-- ======================================================
-- FINAL TEMPLATE (MYSQL COMPATIBLE)
-- ======================================================

-- 1. DATABASE INTEGRITY RULES
-- Note: MySQL doesn't have "CREATE INDEX IF NOT EXISTS" in all versions.
-- These are usually handled in the schema definition, but here are the SQL commands.

-- Prevents duplicate tournaments
-- ALTER TABLE Tournaments ADD UNIQUE INDEX idx_tournament_unique (name, year);

-- Prevents duplicate matches (Same teams on the same date)
-- ALTER TABLE Matches ADD UNIQUE INDEX idx_match_unique (team1, team2, date);


-- 2. Insert Tournaments (Skips if already exists)
INSERT IGNORE INTO Tournaments (name, year, format, winner) 
VALUES ('ICC ODI World Cup', 2023, 'ODI', 'Australia');

INSERT IGNORE INTO Tournaments (name, year, format, winner) 
VALUES ('Border Gavaskar Trophy', 2024, 'Test', 'India');


-- 3. Insert Detailed Matches (Linked using Subqueries + No-Duplicate Check)

-- World Cup Match
INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights)
SELECT id, 'India', 'Pakistan', '14-Oct-2023', 'Ahmedabad', 'ODI', 'India won by 7 wickets', 
       '192/3 (30.3 overs)', '191/10 (42.5 overs)', 'Bumrah 2/19 (Player of the Match)'
FROM Tournaments 
WHERE name = 'ICC ODI World Cup' AND year = 2023
AND NOT EXISTS (SELECT 1 FROM (SELECT * FROM Matches) AS m WHERE team1='India' AND team2='Pakistan' AND date='14-Oct-2023');

-- Test Match (1st Test)
INSERT INTO Matches (tournament_id, team1, team2, date, venue, format, result, score_team1, score_team2, highlights)
SELECT id, 'Australia', 'India', '22-Nov-2024', 'Perth', 'Test', 'India won by 295 runs', 
       '104 & 227', '150 & 487/6d', 'Jaiswal 161, Bumrah 5/30 & 3/42'
FROM Tournaments 
WHERE name = 'Border Gavaskar Trophy' AND year = 2024
AND NOT EXISTS (SELECT 1 FROM (SELECT * FROM Matches) AS m WHERE team1='Australia' AND team2='India' AND date='22-Nov-2024');


-- STEP 4: Verification
SELECT t.name AS Tournament, m.team1, m.score_team1, m.team2, m.score_team2, m.result 
FROM Tournaments t
JOIN Matches m ON t.id = m.tournament_id;
