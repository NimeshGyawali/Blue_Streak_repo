
import { type NextRequest, NextResponse } from 'next/server';
import { JWT_SECRET } from '../../../../../lib/authConstants'; // Corrected relative path
import jwt from 'jsonwebtoken';
// import { pool } from '@/lib/db'; // Uncomment when connecting to the DB

interface DecodedToken {
  userId: string;
  isAdmin: boolean;
  iat: number;
}

interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  error?: string;
  status?: number;
}


// Updated to use JWT for admin check
async function checkAdminStatus(request: NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Authorization header missing or malformed.', status: 401 };
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return { isAdmin: false, error: 'Token not found.', status: 401 };
  }

  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined. Cannot verify token.');
      return { isAdmin: false, error: 'JWT secret not configured on server.', status: 500 };
    }
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    if (!decoded.isAdmin) {
      return { isAdmin: false, error: 'Forbidden: Administrator access required.', status: 403 };
    }
    return { isAdmin: true, userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { isAdmin: false, error: `Invalid token: ${error.message}`, status: 401 };
    }
    console.error('Admin check error:', error);
    return { isAdmin: false, error: 'Internal server error during token validation.', status: 500 };
  }
}

interface ChapterActivity {
  id: string;
  name: string;
  ridesThisMonth: number;
  membersCount: number;
  isBelowThreshold: boolean;
}

const MIN_MONTHLY_RIDES_THRESHOLD = 2; // Define threshold here or fetch from config

export async function GET(request: NextRequest) {
  const adminAuth = await checkAdminStatus(request);
  if (!adminAuth.isAdmin) {
    return NextResponse.json({ message: adminAuth.error || 'Forbidden: Administrator access required.' }, { status: adminAuth.status || 403 });
  }

    // --- TODO: Replace with actual database queries ---
    // You'll need to:
    // 1. Define how "Chapters" or "Groups" are stored in your database.
    //    - e.g., a `chapters` table with `id`, `name`.
    //    - A way to link users to chapters (e.g., `user_chapters` join table or a `chapter_id` on the `users` table).
    // 2. Fetch all chapters.
    // 3. For each chapter:
    //    a. Query the `users` (or `user_chapters`) table to count `membersCount`.
    //    b. Query the `rides` table (potentially filtering by a `chapter_id` on rides or by rides captained/participated by chapter members)
    //       to count `ridesThisMonth` (rides with `date_time` in the current month and an appropriate status like 'Completed', 'Upcoming', 'Ongoing').
    //    c. Determine `isBelowThreshold` based on `ridesThisMonth` and `MIN_MONTHLY_RIDES_THRESHOLD`.

    // const client = await pool.connect();
    // try {
    //   // Example conceptual query (adjust to your schema):
    //   // const chaptersResult = await client.query('SELECT id, name FROM chapters ORDER BY name;');
    //   // const chapterActivityData: ChapterActivity[] = [];
    //   // for (const chapter of chaptersResult.rows) {
    //   //   const membersCountResult = await client.query('SELECT COUNT(*) as count FROM users WHERE chapter_id = $1', [chapter.id]); // or join table
    //   //   const ridesThisMonthResult = await client.query(
    //   //     `SELECT COUNT(*) as count FROM rides
    //   //      WHERE chapter_id = $1  // Or link rides to chapters differently
    //   //      AND date_trunc('month', date_time) = date_trunc('month', CURRENT_DATE)
    //   //      AND status IN ('Completed', 'Upcoming', 'Ongoing')`,
    //   //     [chapter.id]
    //   //   );
    //   //   const ridesThisMonth = parseInt(ridesThisMonthResult.rows[0].count, 10);
    //   //   chapterActivityData.push({
    //   //     id: String(chapter.id),
    //   //     name: chapter.name,
    //   //     ridesThisMonth: ridesThisMonth,
    //   //     membersCount: parseInt(membersCountResult.rows[0].count, 10),
    //   //     isBelowThreshold: ridesThisMonth < MIN_MONTHLY_RIDES_THRESHOLD,
    //   //   });
    //   // }
    //   // return NextResponse.json(chapterActivityData, { status: 200 });
    // } catch (dbError) {
    //   console.error('Get Chapter Activity DB error:', dbError);
    //   return NextResponse.json({ message: 'Database error while fetching chapter activity.' }, { status: 500 });
    // } finally {
    //   client.release();
    // }

    // Returning structured mock data for now
    const mockChapterActivity: ChapterActivity[] = [
      { id: 'chapter1', name: 'Downtown Riders', ridesThisMonth: 6, membersCount: 35, isBelowThreshold: false },
      { id: 'chapter2', name: 'Westside Wheelers', ridesThisMonth: 1, membersCount: 12, isBelowThreshold: true },
      { id: 'chapter3', name: 'North County Cruisers', ridesThisMonth: 3, membersCount: 28, isBelowThreshold: false },
      { id: 'chapter4', name: 'South Bay Rollers', ridesThisMonth: 0, membersCount: 8, isBelowThreshold: true },
    ];

    return NextResponse.json(mockChapterActivity, { status: 200 });
}
