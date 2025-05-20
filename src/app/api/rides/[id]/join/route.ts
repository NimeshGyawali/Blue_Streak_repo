
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/authConstants';

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
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined. Cannot verify token.");
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded.userId;
  } catch (error) {
    console.error('JWT verification error in join ride:', error);
    return null;
  }
}

const rideParamsSchema = z.object({
  id: z.string().uuid("Invalid Ride ID format."),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  const paramsValidation = rideParamsSchema.safeParse(params);
  if (!paramsValidation.success) {
    return NextResponse.json({ message: 'Invalid Ride ID.', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
  }
  const { id: rideId } = paramsValidation.data; // Use validated id

  const client = await pool.connect();
  try {
    // Check if ride exists and is upcoming
    const rideResult = await client.query(
      "SELECT id, status, captain_id FROM rides WHERE id = $1",
      [rideId]
    );
    if (rideResult.rows.length === 0) {
      return NextResponse.json({ message: 'Ride not found.' }, { status: 404 });
    }

    const ride = rideResult.rows[0];
    if (ride.status !== 'Upcoming') {
      return NextResponse.json({ message: `Ride is not upcoming. Current status: ${ride.status}` }, { status: 400 });
    }
    
    if (String(ride.captain_id) === userId) {
       return NextResponse.json({ message: 'Captain cannot join their own ride as a participant.' }, { status: 400 });
    }


    // Check if user is already a participant
    const existingParticipantResult = await client.query(
      'SELECT user_id FROM ride_participants WHERE ride_id = $1 AND user_id = $2',
      [rideId, userId]
    );
    if (existingParticipantResult.rows.length > 0) {
      return NextResponse.json({ message: 'You have already joined this ride.' }, { status: 409 });
    }

    // Add user to participants
    await client.query(
      'INSERT INTO ride_participants (ride_id, user_id, joined_at) VALUES ($1, $2, NOW())',
      [rideId, userId]
    );

    return NextResponse.json({ message: 'Successfully joined the ride!' }, { status: 200 });

  } catch (dbError) {
    console.error('Join Ride DB error:', dbError);
    return NextResponse.json({ message: 'Database error while trying to join ride.' }, { status: 500 });
  } finally {
    client.release();
  }
}
