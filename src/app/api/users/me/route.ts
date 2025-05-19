
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/authConstants';
import type { User } from '@/types';

interface DecodedToken {
  userId: string;
  isAdmin: boolean;
  iat: number;
  // add other claims if you have them, like exp
}

async function getAuthenticatedUser(request: NextRequest): Promise<{ user: User | null, error?: string, status?: number }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Authorization header missing or malformed.', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { user: null, error: 'Token not found.', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, name, email, city, bike_model, vin, is_captain, is_verified, is_admin, avatar_url FROM users WHERE id = $1',
        [decoded.userId]
      );
      if (result.rows.length === 0) {
        return { user: null, error: 'User not found.', status: 404 };
      }
      const dbUser = result.rows[0];
      const user: User = {
        id: String(dbUser.id),
        name: dbUser.name,
        email: dbUser.email,
        city: dbUser.city,
        bikeModel: dbUser.bike_model,
        vin: dbUser.vin,
        isCaptain: dbUser.is_captain,
        is_verified: dbUser.is_verified,
        is_admin: dbUser.is_admin,
        avatarUrl: dbUser.avatar_url,
      };
      return { user };
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { user: null, error: `Invalid token: ${error.message}`, status: 401 };
    }
    console.error('Get Authenticated User error:', error);
    return { user: null, error: 'Internal server error.', status: 500 };
  }
}

export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedUser(request);

  if (!authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication failed.' }, { status: authResult.status || 401 });
  }

  return NextResponse.json(authResult.user, { status: 200 });
}
