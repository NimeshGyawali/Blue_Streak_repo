
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
    console.error('JWT verification error in join/leave ride:', error);
    return null;
  }
}

const rideParamsSchema = z.object({
  id: z.string().uuid("Invalid Ride ID format."),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } } // Ensure this expects params.id
) {
  const userId = await getAuthenticatedUserIdFromToken(request);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  const paramsValidation = rideParamsSchema.safeParse(params);
  if (!paramsValidation.success) {
    return NextResponse.json({ message: 'Invalid Ride ID.', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
  }
  const { id: rideId } = paramsValidation.data; // Use rideId internally after validating params.id

  const client = await pool.connect();
  try {
    const rideResult = await client.query('SELECT id FROM rides WHERE id = $1', [rideId]);
    if (rideResult.rows.length === 0) {
      return NextResponse.json({ message: 'Ride not found.' }, { status: 404 });
    }

    const deleteResult = await client.query(
      'DELETE FROM ride_participants WHERE ride_id = $1 AND user_id = $2 RETURNING user_id',
      [rideId, userId]
    );

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ message: 'You were not a participant in this ride or already left.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Successfully left the ride.' }, { status: 200 });

  } catch (dbError) {
    console.error('Leave Ride DB error:', dbError);
    return NextResponse.json({ message: 'Database error while trying to leave ride.' }, { status: 500 });
  } finally {
    client.release();
  }
}
