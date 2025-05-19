
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/authConstants';
import type { Achievement } from '@/types';

interface DecodedToken {
  userId: string;
  isAdmin: boolean;
  iat: number;
  // add other claims if you have them, like exp
}

async function getAuthenticatedUserIdFromToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded.userId;
  } catch (error)
    // console.error('JWT verification error in getAuthenticatedUserIdFromToken:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserIdFromToken(request);

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        a.id::text,
        a.name,
        a.description,
        a.icon_name,
        a.criteria_details,
        ua.date_earned
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
      ORDER BY ua.date_earned DESC;
    `;

    const result = await client.query(query, [userId]);

    const achievements: Achievement[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon_name: row.icon_name,
      criteria_details: row.criteria_details,
      date_earned: new Date(row.date_earned).toISOString(),
    }));

    return NextResponse.json(achievements, { status: 200 });

  } catch (dbError) {
    console.error('Get User Achievements DB error:', dbError);
    return NextResponse.json({ message: 'Database error while fetching user achievements.' }, { status: 500 });
  } finally {
    client.release();
  }
}

// TODO: Future - Logic for *awarding* achievements would typically reside in other API endpoints
// that handle relevant user actions (e.g., ride completion, photo upload, etc.)
// or in a separate background service/job.
// Example pseudo-code for awarding an achievement:
// async function awardAchievement(userId: string, achievementName: string) {
//   const client = await pool.connect();
//   try {
//     const achievementResult = await client.query('SELECT id FROM achievements WHERE name = $1', [achievementName]);
//     if (achievementResult.rows.length > 0) {
//       const achievementId = achievementResult.rows[0].id;
//       // Check if user already has this achievement to prevent duplicates (though DB unique constraint handles this)
//       const existingUserAchievement = await client.query(
//         'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
//         [userId, achievementId]
//       );
//       if (existingUserAchievement.rows.length === 0) {
//         await client.query(
//           'INSERT INTO user_achievements (user_id, achievement_id, date_earned) VALUES ($1, $2, NOW())',
//           [userId, achievementId]
//         );
//         console.log(`Awarded achievement '${achievementName}' to user ${userId}`);
//       }
//     }
//   } catch (error) {
//     console.error(`Error awarding achievement ${achievementName} to user ${userId}:`, error);
//   } finally {
//     client.release();
//   }
// }
