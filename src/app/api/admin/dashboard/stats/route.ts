
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { JWT_SECRET } from '@/lib/authConstants'; // Using the alias
import jwt from 'jsonwebtoken';
import type { User } from '@/types';

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

async function checkAdminStatus(request: NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Authorization header missing or malformed.', status: 401 };
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return { isAdmin: false, error: 'Token not found.', status: 401 };
  }

  if (!JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET is not configured on the server for /api/admin/dashboard/stats.');
    return { isAdmin: false, error: 'JWT secret not configured on server.', status: 500 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    if (!decoded.isAdmin) {
      return { isAdmin: false, error: 'Forbidden: Administrator access required.', status: 403 };
    }
    return { isAdmin: true, userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { isAdmin: false, error: `Invalid token: ${error.message}`, status: 401 };
    }
    console.error('Admin check error in /api/admin/dashboard/stats:', error);
    return { isAdmin: false, error: 'Internal server error during token validation.', status: 500 };
  }
}

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingUserVerifications: number;
  totalRides: number;
  upcomingRides: number;
  pendingRideApprovals: number;
  activeSystemAlerts: number;
}

export async function GET(request: NextRequest) {
  const adminAuth = await checkAdminStatus(request);
  if (!adminAuth.isAdmin) {
    return NextResponse.json({ message: adminAuth.error || 'Forbidden: Administrator access required.' }, { status: adminAuth.status || 403 });
  }

  const client = await pool.connect();
  try {
    const stats: Partial<DashboardStats> = {};

    const totalUsersRes = await client.query('SELECT COUNT(*) AS count FROM users');
    stats.totalUsers = parseInt(totalUsersRes.rows[0].count, 10);

    const verifiedUsersRes = await client.query("SELECT COUNT(*) AS count FROM users WHERE is_verified = TRUE");
    stats.verifiedUsers = parseInt(verifiedUsersRes.rows[0].count, 10);
    
    stats.pendingUserVerifications = (stats.totalUsers || 0) - (stats.verifiedUsers || 0);

    // Ensure status strings match your database enum/values exactly
    const totalRidesRes = await client.query("SELECT COUNT(*) AS count FROM rides WHERE status NOT IN ('Rejected', 'Cancelled')");
    stats.totalRides = parseInt(totalRidesRes.rows[0].count, 10);

    const upcomingRidesRes = await client.query("SELECT COUNT(*) AS count FROM rides WHERE status = 'Upcoming'");
    stats.upcomingRides = parseInt(upcomingRidesRes.rows[0].count, 10);

    const pendingRideApprovalsRes = await client.query("SELECT COUNT(*) AS count FROM rides WHERE status = 'Pending Approval'");
    stats.pendingRideApprovals = parseInt(pendingRideApprovalsRes.rows[0].count, 10);
    
    const activeSystemAlertsRes = await client.query("SELECT COUNT(*) AS count FROM system_alerts WHERE status NOT IN ('Resolved', 'Dismissed')");
    stats.activeSystemAlerts = parseInt(activeSystemAlertsRes.rows[0].count, 10);

    return NextResponse.json(stats as DashboardStats, { status: 200 });

  } catch (error) {
    console.error('Get Dashboard Stats API database error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred fetching dashboard stats from database.' }, { status: 500 });
  } finally {
    client.release();
  }
}
