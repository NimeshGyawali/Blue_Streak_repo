
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/authConstants';
import type { User, Ride } from '@/types';

interface DecodedToken {
  userId: string;
  isAdmin: boolean;
  iat: number;
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
  } catch (error) {
    console.error('JWT verification error:', error);
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
    // Query to get rides the user participated in or captained
    // DISTINCT ensures rides aren't duplicated if a captain is also listed as a participant
    const query = `
      SELECT DISTINCT
        r.id::text,
        r.name,
        r.type,
        r.description,
        r.route_start,
        r.route_end,
        r.route_map_link,
        r.date_time,
        r.status,
        r.thumbnail_url,
        r.photo_hints,
        json_build_object(
          'id', cap.id::text,
          'name', cap.name,
          'avatarUrl', cap.avatar_url,
          'bikeModel', cap.bike_model
        ) as captain,
        (SELECT COUNT(*) FROM ride_participants rp_count WHERE rp_count.ride_id = r.id) as participants_count
      FROM rides r
      JOIN users cap ON r.captain_id = cap.id
      LEFT JOIN ride_participants rp ON r.id = rp.ride_id
      WHERE r.captain_id = $1 OR rp.user_id = $1
      ORDER BY r.date_time DESC;
    `;

    const result = await client.query(query, [userId]);

    const rides: Ride[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as Ride['type'],
      description: row.description,
      route: {
        start: row.route_start,
        end: row.route_end,
        mapLink: row.route_map_link,
      },
      dateTime: new Date(row.date_time),
      captain: row.captain as User,
      // For history view, participant count is usually enough.
      // The full participant list can be fetched on the ride detail page.
      participants: Array(parseInt(row.participants_count, 10)).fill(null).map((_, i) => ({ id: `dummyhistory${i}`, name: `Participant ${i + 1}` })),
      status: row.status as Ride['status'],
      thumbnailUrl: row.thumbnail_url,
      photoHints: row.photo_hints,
      photos: [], // Full photos list would be fetched on ride detail page
    }));

    return NextResponse.json(rides, { status: 200 });

  } catch (dbError) {
    console.error('Get User Ride History DB error:', dbError);
    return NextResponse.json({ message: 'Database error while fetching user ride history.' }, { status: 500 });
  } finally {
    client.release();
  }
}
