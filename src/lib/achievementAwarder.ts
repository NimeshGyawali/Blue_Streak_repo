
'use server';

import type { PoolClient } from 'pg';
import { pool } from '@/lib/db';

/**
 * Awards a specific achievement to a user if they haven't earned it already.
 * @param userId The ID of the user to award the achievement to.
 * @param achievementName The unique name of the achievement (e.g., 'First Ride Completed', 'Road Captain').
 * @param dbClient Optional PoolClient if called within an existing transaction.
 * @returns Promise<boolean> True if awarded or already had, false on error or if achievement not found.
 */
export async function awardAchievement(
  userId: string,
  achievementName: string,
  dbClient?: PoolClient
): Promise<boolean> {
  const client = dbClient || (await pool.connect());
  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Get achievement_id from achievement_name
    const achievementResult = await client.query(
      'SELECT id FROM achievements WHERE name = $1',
      [achievementName]
    );

    if (achievementResult.rows.length === 0) {
      console.warn(`Achievement with name "${achievementName}" not found.`);
      await client.query('ROLLBACK');
      return false;
    }
    const achievementId = achievementResult.rows[0].id;

    // 2. Check if user already has this achievement
    const existingUserAchievement = await client.query(
      'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
      [userId, achievementId]
    );

    if (existingUserAchievement.rows.length > 0) {
      // console.log(`User ${userId} already has achievement "${achievementName}". No action needed.`);
      await client.query('COMMIT'); // Commit even if already awarded to release transaction
      return true; // Already has it
    }

    // 3. Award the achievement
    await client.query(
      'INSERT INTO user_achievements (user_id, achievement_id, date_earned) VALUES ($1, $2, NOW())',
      [userId, achievementId]
    );
    console.log(`Awarded achievement "${achievementName}" to user ${userId}.`);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error awarding achievement "${achievementName}" to user ${userId}:`, error);
    return false;
  } finally {
    if (!dbClient) {
      client.release();
    }
  }
}
