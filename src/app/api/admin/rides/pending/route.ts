
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { Ride, User } from '@/types';

// TODO: Replace this with your actual admin authentication logic
async function checkAdminStatus(request: NextRequest): Promise<boolean> {
  console.warn("SECURITY WARNING: Admin check in /api/admin/rides/pending/route.ts GET is a placeholder and always returns true. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  // Placeholder logic:
  // 1. Extract token/session from request.
  // 2. Validate token/session.
  // 3. Query database for user associated with token/session and check their is_admin flag.
  return true; // REMOVE THIS AND IMPLEMENT REAL LOGIC
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminStatus(request);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          r.id, 
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
            'id', u.id::text, -- Ensure captain's id is text if User type expects string
            'name', u.name, 
            'avatarUrl', u.avatar_url
          ) as captain
        FROM rides r
        JOIN users u ON r.captain_id = u.id 
        WHERE r.status = 'Pending Approval'
        ORDER BY r.created_at DESC;
      `;
      
      const result = await client.query(query);
      
      const rides: Ride[] = result.rows.map(row => ({
        id: String(row.id), // Ensure ride id is a string
        name: row.name,
        type: row.type as 'Flagship' | 'Chapter' | 'Micro', // Cast to specific type
        description: row.description,
        route: { 
          start: row.route_start, 
          end: row.route_end, 
          mapLink: row.route_map_link 
        },
        dateTime: new Date(row.date_time),
        captain: row.captain as User, // The query constructs this as per User type
        participants: [], // Participants data not fetched in this admin view for simplicity
        status: row.status as 'Pending Approval', // Cast to specific type
        thumbnailUrl: row.thumbnail_url,
        photoHints: row.photo_hints,
        // photos field is omitted as it's not fetched here
      }));
      
      return NextResponse.json(rides, { status: 200 });

    } catch (dbError) {
      console.error('List Pending Rides DB error:', dbError);
      return NextResponse.json({ message: 'Database error while fetching pending rides.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('List Pending Rides API error:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
        return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

