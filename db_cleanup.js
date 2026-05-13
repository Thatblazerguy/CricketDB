const { getDb } = require('./db/database');

async function cleanup() {
    const db = getDb();
    console.log('Starting Database Cleanup (MySQL)...');

    try {
        // 1. CLEANUP PLAYERS TABLE (Merge duplicates)
        console.log('Merging duplicate players...');
        const [duplicatePlayers] = await db.execute(`
            SELECT name, MIN(id) as master_id, GROUP_CONCAT(id) as all_ids
            FROM Players
            GROUP BY name
            HAVING COUNT(*) > 1
        `);

        for (const player of duplicatePlayers) {
            const masterId = player.master_id;
            const allIds = player.all_ids.split(',').filter(id => id != masterId);
            
            console.log(`Merging ${player.name}: Keeping ID ${masterId}, removing IDs ${allIds.join(', ')}`);

            for (const oldId of allIds) {
                // Update references in other tables
                await db.execute('UPDATE PlayerStats SET player_id = ? WHERE player_id = ?', [masterId, oldId]);
                await db.execute('UPDATE TournamentStats SET player_id = ? WHERE player_id = ?', [masterId, oldId]);
                await db.execute('UPDATE MatchPerformances SET player_id = ? WHERE player_id = ?', [masterId, oldId]);
                await db.execute("UPDATE UserFavorites SET ref_id = ? WHERE type = 'player' AND ref_id = ?", [masterId, oldId]);
                
                // Delete the duplicate player
                await db.execute('DELETE FROM Players WHERE id = ?', [oldId]);
            }
        }

        // 2. CLEANUP PLAYERSTATS TABLE (Remove duplicate stat rows for same player/format)
        console.log('Removing duplicate stat entries...');
        const [duplicateStats] = await db.execute(`
            SELECT player_id, format, COUNT(*) as count
            FROM PlayerStats
            GROUP BY player_id, format
            HAVING COUNT(*) > 1
        `);

        for (const stat of duplicateStats) {
            // Find the "best" record
            const [bestRecords] = await db.execute(`
                SELECT id FROM PlayerStats 
                WHERE player_id = ? AND format = ? 
                ORDER BY runs DESC, matches DESC, id DESC LIMIT 1
            `, [stat.player_id, stat.format]);
            
            const bestRecord = bestRecords[0];

            if (bestRecord) {
                // Delete all other records for this player/format
                await db.execute(`
                    DELETE FROM PlayerStats 
                    WHERE player_id = ? AND format = ? AND id != ?
                `, [stat.player_id, stat.format, bestRecord.id]);
                console.log(`Cleaned stats for Player ID ${stat.player_id} (${stat.format})`);
            }
        }

        console.log('✅ Cleanup complete!');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        // Pool stays open if called from elsewhere, but if standalone we might want to end it
        // db.end(); 
    }
}

if (require.main === module) {
    cleanup();
}

module.exports = cleanup;
