
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';
import type { Ride } from '@/types';

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
  
  console.warn("SECURITY WARNING: Admin check in /api/admin/rides/[rideId]/reject/route.ts PATCH is a placeholder. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  // return { isAdmin: true, userId: '00000000-0000-0000-0000-000000000001' }; // REMOVE/SECURE THIS
  return { isAdmin: false, error: 'Invalid token.', status: 401 };
}

const rejectRideParamsSchema = z.object({
  rideId: z.string().uuid("Invalid Ride ID format."), 
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rideId: string } }
) {
  const adminAuth = await checkAdminStatus(request);
  if (!adminAuth.isAdmin) {
    return NextResponse.json({ message: adminAuth.error || 'Forbidden: Administrator access required.' }, { status: adminAuth.status || 403 });
  }

  try {
    const paramsValidation = rejectRideParamsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ message: 'Invalid input in URL parameters.', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { rideId } = paramsValidation.data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const rideResult = await client.query(
        'SELECT id, status FROM rides WHERE id = $1 FOR UPDATE',
        [rideId]
      );

      if (rideResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Ride not found.' }, { status: 404 });
      }

      const ride = rideResult.rows[0];
      if (ride.status !== 'Pending Approval') {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: `Ride is not pending approval. Current status: ${ride.status}` }, { status: 400 });
      }

      const updateResult = await client.query(
        `UPDATE rides 
         SET status = 'Rejected', updated_at = NOW() 
         WHERE id = $1 
         RETURNING id, name, type, description, route_start, route_end, route_map_link, date_time, captain_id, status, thumbnail_url, photo_hints`,
        [rideId]
      );
      
      const rejectedRideDb = updateResult.rows[0];
      const rejectedRide: Partial<Ride> = { // Mapping to ensure correct types
        id: String(rejectedRideDb.id),
        name: rejectedRideDb.name,
        type: rejectedRideDb.type as Ride['type'],
        description: rejectedRideDb.description,
        route: { 
          start: rejectedRideDb.route_start, 
          end: rejectedRideDb.route_end, 
          mapLink: rejectedRideDb.route_map_link 
        },
        dateTime: new Date(rejectedRideDb.date_time),
        captain: { id: String(rejectedRideDb.captain_id), name: 'Fetching...' },
        participants: [],
        status: rejectedRideDb.status as Ride['status'],
        thumbnailUrl: rejectedRideDb.thumbnail_url,
        photoHints: rejectedRideDb.photo_hints,
      };
      
      await client.query('COMMIT');
      return NextResponse.json({ message: 'Ride rejected successfully!', ride: rejectedRide }, { status: 200 });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Reject Ride DB error:', dbError);
      return NextResponse.json({ message: 'Database error during ride rejection.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Reject Ride API error:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
