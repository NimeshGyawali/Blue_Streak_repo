
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { Ride, User } from '@/types'; // Ensure User is imported

interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string; 
  error?: string;
  status?: number;
}

// TODO: Replace this with your actual admin authentication logic
async function checkAdminStatus(request: NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Authorization header missing or malformed.', status: 401 };
  }
  const token = authHeader.split(' ')[1];

  if (token === process.env.DUMMY_ADMIN_TOKEN || (process.env.JWT_SECRET && token === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE3MDQwMzIwMDB9.dummy_admin_signature")) {
    return { isAdmin: true, userId: '00000000-0000-0000-0000-000000000001' };
  }
   if (token === process.env.DUMMY_USER_TOKEN) {
    return { isAdmin: false, error: 'Forbidden: Administrator access required.', status: 403 };
  }
  if (!process.env.JWT_SECRET) console.warn("JWT_SECRET is not set. Real token validation skipped.");
  
  console.warn("SECURITY WARNING: Admin check in /api/admin/rides/pending/route.ts GET is a placeholder. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  // return { isAdmin: true, userId: '00000000-0000-0000-0000-000000000001' }; // REMOVE/SECURE THIS
  return { isAdmin: false, error: 'Invalid token.', status: 401 };
}

export async function GET(request: NextRequest) {
  const adminAuth = await checkAdminStatus(request);
  if (!adminAuth.isAdmin) {
    return NextResponse.json({ message: adminAuth.error || 'Forbidden: Administrator access required.' }, { status: adminAuth.status || 403 });
  }

  try {
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
            'id', u.id::text, 
            'name', u.name, 
            'avatarUrl', u.avatar_url,
            'bikeModel', u.bike_model,
            'city', u.city,
            'isCaptain', u.is_captain,
            'is_verified', u.is_verified,
            'is_admin', u.is_admin
          ) as captain
        FROM rides r
        JOIN users u ON r.captain_id = u.id 
        WHERE r.status = 'Pending Approval'
        ORDER BY r.created_at DESC;
      `;
      
      const result = await client.query(query);
      
      const rides: Ride[] = result.rows.map(row => ({
        id: String(row.id), 
        name: row.name,
        type: row.type as Ride['type'], 
        description: row.description,
        route: { 
          start: row.route_start, 
          end: row.route_end, 
          mapLink: row.route_map_link 
        },
        dateTime: new Date(row.date_time),
        captain: row.captain as User, 
        participants: [], 
        status: row.status as Ride['status'], 
        thumbnailUrl: row.thumbnail_url,
        photoHints: row.photo_hints,
        photos: [], 
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
