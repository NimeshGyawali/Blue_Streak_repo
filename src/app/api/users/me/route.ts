
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/authConstants';
import type { User } from '@/types';
import { z } from 'zod';

interface DecodedToken {
  userId: string;
  isAdmin: boolean;
  iat: number;
  // add other claims if you have them, like exp
}

async function getAuthenticatedUserFromRequest(request: NextRequest): Promise<{ user: User | null, userIdFromToken?: string, error?: string, status?: number }> {
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
        return { user: null, error: 'User not found.', status: 404, userIdFromToken: decoded.userId };
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
      return { user, userIdFromToken: decoded.userId };
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
  const authResult = await getAuthenticatedUserFromRequest(request);

  if (!authResult.user) {
    return NextResponse.json({ message: authResult.error || 'Authentication failed.' }, { status: authResult.status || 401 });
  }

  return NextResponse.json(authResult.user, { status: 200 });
}

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  city: z.string().min(1, "City/Region is required.").optional(),
  bikeModel: z.string().min(1, "Yamaha Bike Model is required.").optional(),
  // VIN is typically not user-editable after initial signup for verification purposes
  // avatarUrl: z.string().url("Invalid avatar URL.").optional(), // For when avatar upload is via URL
});

export async function PATCH(request: NextRequest) {
  const authResult = await getAuthenticatedUserFromRequest(request);

  if (!authResult.userIdFromToken) {
    return NextResponse.json({ message: authResult.error || 'Authentication required.' }, { status: authResult.status || 401 });
  }
  const userId = authResult.userIdFromToken;

  try {
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, city, bikeModel } = validation.data;

    if (!name && !city && !bikeModel) {
      return NextResponse.json({ message: 'No updatable fields provided.' }, { status: 400 });
    }
    
    const fieldsToUpdate: { [key: string]: any } = {};
    if (name) fieldsToUpdate.name = name;
    if (city) fieldsToUpdate.city = city;
    if (bikeModel) fieldsToUpdate.bike_model = bikeModel;
    
    const querySetParts: string[] = [];
    const queryValues: any[] = [];
    let queryParamIndex = 1;

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      querySetParts.push(`${key} = $${queryParamIndex++}`);
      queryValues.push(value);
    });

    if (querySetParts.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update provided.' }, { status: 400 });
    }
    
    queryValues.push(userId); // For the WHERE clause

    const client = await pool.connect();
    try {
      const updateQuery = `
        UPDATE users 
        SET ${querySetParts.join(', ')}, updated_at = NOW()
        WHERE id = $${queryParamIndex}
        RETURNING id, name, email, city, bike_model, vin, is_captain, is_verified, is_admin, avatar_url;
      `;
      
      const result = await client.query(updateQuery, queryValues);

      if (result.rows.length === 0) {
        // This shouldn't happen if userIdFromToken was valid, but as a safeguard
        return NextResponse.json({ message: 'User not found or update failed.' }, { status: 404 });
      }
      
      const updatedUserDb = result.rows[0];
      const updatedUser: User = {
        id: String(updatedUserDb.id),
        name: updatedUserDb.name,
        email: updatedUserDb.email,
        city: updatedUserDb.city,
        bikeModel: updatedUserDb.bike_model,
        vin: updatedUserDb.vin,
        isCaptain: updatedUserDb.is_captain,
        is_verified: updatedUserDb.is_verified,
        is_admin: updatedUserDb.is_admin,
        avatarUrl: updatedUserDb.avatar_url,
      };

      return NextResponse.json(updatedUser, { status: 200 });

    } catch (dbError) {
      console.error('Update User DB error:', dbError);
      return NextResponse.json({ message: 'Database error during profile update.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update User API error:', error);
    if (error instanceof z.ZodError) { 
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred processing your request.' }, { status: 500 });
  }
}
