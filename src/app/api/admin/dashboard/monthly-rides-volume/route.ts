
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { JWT_SECRET } from '../../../../../lib/authConstants'; // Corrected relative path
import jwt from 'jsonwebtoken';

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

// Updated to use JWT for admin check
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
      return { isAdmin: false, error: 'JWT secret not configured on server.', status: 500 };
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


interface MonthlyRideStats {
  month: string; // e.g., "Jan", "Feb"
  rides: number;
}

export async function GET(request: NextRequest) {
  const adminAuth = await checkAdminStatus(request);
  if (!adminAuth.isAdmin) {
    return NextResponse.json({ message: adminAuth.error || 'Forbidden: Administrator access required.' }, { status: adminAuth.status || 403 });
  }

  const client = await pool.connect();
  try {
    // Query to get ride counts per month for the current year (or last 12 months)
    // This example gets counts for the last 6 months including the current month.
    const query = `
      SELECT 
        TO_CHAR(date_trunc('month', r.date_time), 'Mon') AS month_name,
        EXTRACT(YEAR FROM date_trunc('month', r.date_time)) AS year,
        EXTRACT(MONTH FROM date_trunc('month', r.date_time)) AS month_numeric,
        COUNT(r.id) AS rides_count
      FROM 
        rides r
      WHERE 
        r.date_time >= date_trunc('month', NOW() - INTERVAL '5 months') AND r.date_time < date_trunc('month', NOW() + INTERVAL '1 month')
        AND r.status IN ('Completed', 'Ongoing', 'Upcoming', 'Approved') -- Consider which statuses count towards volume
      GROUP BY 
        date_trunc('month', r.date_time), month_name, year, month_numeric
      ORDER BY 
        year ASC, month_numeric ASC;
    `;
    
    const result = await client.query(query);
    
    const monthlyRideDataFromDb: MonthlyRideStats[] = result.rows.map(row => ({
      month: row.month_name, // e.g., "Jan", "Feb"
      rides: parseInt(row.rides_count, 10),
    }));
    
    // Ensure all last 6 months are present, even with 0 rides:
    const allMonthsData: MonthlyRideStats[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    for (let i = 5; i >= 0; i--) { // Iterate from 5 months ago up to the current month
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthShortName = monthNames[date.getMonth()];
        const existingData = monthlyRideDataFromDb.find(d => d.month === monthShortName && new Date(date.getFullYear(), date.getMonth()).getFullYear() === new Date(today.getFullYear(), today.getMonth() -i).getFullYear() ); // Ensure year matches for finding data
        allMonthsData.push({
            month: monthShortName,
            rides: existingData ? existingData.rides : 0,
        });
    }

    return NextResponse.json(allMonthsData, { status: 200 });

  } catch (error) {
    console.error('Get Monthly Rides Volume API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred fetching monthly rides volume.' }, { status: 500 });
  } finally {
    client.release();
  }
}
