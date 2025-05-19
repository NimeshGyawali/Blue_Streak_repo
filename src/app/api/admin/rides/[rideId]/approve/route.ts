
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { awardAchievement } from '@/lib/achievementAwarder';
import type { User, Ride } from '@/types';

interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string; // ID of the admin user performing the action
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

  // In a real app, verify the JWT and fetch user roles
  // For now, using placeholder logic
  if (token === process.env.DUMMY_ADMIN_TOKEN || (process.env.JWT_SECRET && token === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE3MDQwMzIwMDB9.dummy_admin_signature")) { // Second part is a conceptual valid admin JWT
    return { isAdmin: true, userId: '00000000-0000-0000-0000-000000000001' }; // Placeholder admin ID
  }
  if (token === process.env.DUMMY_USER_TOKEN) {
    return { isAdmin: false, error: 'Forbidden: Administrator access required.', status: 403 };
  }
  // Fallback for other tokens or if JWT_SECRET is not set for the conceptual valid token
  if (!process.env.JWT_SECRET) console.warn("JWT_SECRET is not set. Real token validation skipped.");

  console.warn("SECURITY WARNING: Admin check in /api/admin/rides/[rideId]/approve/route.ts PATCH is a placeholder. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  // Default to true for now if no specific dummy tokens match and no real JWT validation is in place.
  // This should be false in a production secure setup.
  // return { isAdmin: true, userId: '00000000-0000-0000-0000-000000000001' }; // REMOVE/SECURE THIS
   return { isAdmin: false, error: 'Invalid token.', status: 401 };
}


const approveRideParamsSchema = z.object({
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
    const validation = approveRideParamsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { rideId } = validation.data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const rideResult = await client.query(
        'SELECT id, status, date_time, captain_id FROM rides WHERE id = $1 FOR UPDATE', // Add FOR UPDATE for transaction safety
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
         SET status = 'Upcoming', updated_at = NOW() 
         WHERE id = $1 
         RETURNING id, name, type, description, route_start, route_end, route_map_link, date_time, captain_id, status, thumbnail_url, photo_hints`,
        [rideId]
      );

      const approvedRideDb = updateResult.rows[0];
       const approvedRide: Partial<Ride> = { // Mapping to ensure correct types
        id: String(approvedRideDb.id),
        name: approvedRideDb.name,
        type: approvedRideDb.type as Ride['type'],
        description: approvedRideDb.description,
        route: { 
          start: approvedRideDb.route_start, 
          end: approvedRideDb.route_end, 
          mapLink: approvedRideDb.route_map_link 
        },
        dateTime: new Date(approvedRideDb.date_time),
        captain: { id: String(approvedRideDb.captain_id), name: 'Fetching...' }, // Captain name needs to be fetched or joined
        participants: [],
        status: approvedRideDb.status as Ride['status'],
        thumbnailUrl: approvedRideDb.thumbnail_url,
        photoHints: approvedRideDb.photo_hints,
      };


      // Achievement Awarding Logic
      // Consider a ride "completed" for achievement purposes if its date is in the past upon approval
      const rideDateTime = new Date(approvedRideDb.date_time);
      if (rideDateTime < new Date()) {
        const captainId = String(approvedRideDb.captain_id);
        
        // Award 'Road Captain' to the captain
        await awardAchievement(captainId, 'Road Captain', client);

        // Fetch participants and award 'First Ride Completed'
        const participantsResult = await client.query(
          'SELECT user_id FROM ride_participants WHERE ride_id = $1',
          [rideId]
        );

        for (const participantRow of participantsResult.rows) {
          const participantId = String(participantRow.user_id);
          await awardAchievement(participantId, 'First Ride Completed', client);
        }
      }
      
      await client.query('COMMIT');
      return NextResponse.json({ message: 'Ride approved successfully!', ride: approvedRide }, { status: 200 });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Approve Ride DB error:', dbError);
      return NextResponse.json({ message: 'Database error during ride approval.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Approve Ride API error:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
