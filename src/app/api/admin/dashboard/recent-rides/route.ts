
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { JWT_SECRET } from '@/lib/authConstants';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';
import { format } from 'date-fns';

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

// TODO: Replace this with your actual robust admin authentication logic if not already done
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
      return { isAdmin: false, error: 'JWT secret not configured.', status: 500 };
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

interface RecentRideActivity {
  id: string;
  name: string;
  status: 'Ongoing' | 'Upcoming' | 'Recently Completed';
  participantsCount: number;
  startTime?: string; // Formatted start time for display
  captain: string;
  dateTime: string; // Raw ISO date for potential client-side formatting
}

export async function GET(request: NextRequest) {
  const adminAuth = await checkAdminStatus(request);
  if (!adminAuth.isAdmin) {
    return NextResponse.json({ message: adminAuth.error || 'Forbidden: Administrator access required.' }, { status: adminAuth.status || 403 });
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT
          r.id::text,
          r.name,
          r.status,
          r.date_time,
          u.name as captain_name,
          (SELECT COUNT(*) FROM ride_participants rp WHERE rp.ride_id = r.id) as participants_count
      FROM
          rides r
      JOIN
          users u ON r.captain_id = u.id
      WHERE
          r.status IN ('Ongoing', 'Upcoming', 'Completed')
      ORDER BY
          CASE r.status
              WHEN 'Ongoing' THEN 1
              WHEN 'Upcoming' THEN 2
              WHEN 'Completed' THEN 3
              ELSE 4
          END,
          CASE r.status
              WHEN 'Upcoming' THEN r.date_time ASC
              WHEN 'Ongoing' THEN r.date_time ASC 
              WHEN 'Completed' THEN r.date_time DESC
              ELSE r.date_time ASC
          END
      LIMIT 5;
    `;
    
    const result = await client.query(query);
    
    const recentRides: RecentRideActivity[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status as RecentRideActivity['status'],
      participantsCount: parseInt(row.participants_count, 10),
      startTime: row.status !== 'Completed' ? format(new Date(row.date_time), 'MMM dd, HH:mm') : undefined,
      captain: row.captain_name,
      dateTime: new Date(row.date_time).toISOString(),
    }));

    return NextResponse.json(recentRides, { status: 200 });

  } catch (error) {
    console.error('Get Recent Rides API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred fetching recent rides.' }, { status: 500 });
  } finally {
    client.release();
  }
}
