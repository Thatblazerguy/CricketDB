-- ======================================================
-- MANUAL PLAYER INSERT (FOLLOWING MARKDOWN SCHEMA)
-- ======================================================

-- 1. Ensure schema matches markdown (Adding jersey_number if missing)
-- Note: MySQL doesn't have 'ADD COLUMN IF NOT EXISTS', so we use a simple ALTER.
-- If this fails because it exists, the rest will still run.
ALTER TABLE Players ADD COLUMN jersey_number INT;

-- 2. Insert Players manually using SQL
-- Schema: name, country, role, batting_style, bowling_style, jersey_number

-- India
INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Virat Kohli', 'India', 'Batsman', 'Right-handed', 'Right-arm medium', 18);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Rohit Sharma', 'India', 'Batsman', 'Right-handed', 'Right-arm off-break', 45);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Jasprit Bumrah', 'India', 'Bowler', 'Right-handed', 'Right-arm fast', 93);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Hardik Pandya', 'India', 'All-rounder', 'Right-handed', 'Right-arm fast-medium', 33);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Rishabh Pant', 'India', 'Wicket-keeper', 'Left-handed', '-', 17);

-- Australia
INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Steve Smith', 'Australia', 'Batsman', 'Right-handed', 'Right-arm leg-break', 49);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Mitchell Starc', 'Australia', 'Bowler', 'Left-handed', 'Left-arm fast', 56);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Glenn Maxwell', 'Australia', 'All-rounder', 'Right-handed', 'Right-arm off-break', 32);

-- England
INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Joe Root', 'England', 'Batsman', 'Right-handed', 'Right-arm off-break', 66);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Ben Stokes', 'England', 'All-rounder', 'Left-handed', 'Right-arm fast-medium', 55);

INSERT INTO Players (name, country, role, batting_style, bowling_style, jersey_number) 
VALUES ('Jos Buttler', 'England', 'Wicket-keeper', 'Right-handed', '-', 63);

-- Verification
SELECT name, country, role, jersey_number FROM Players ORDER BY country, name;
