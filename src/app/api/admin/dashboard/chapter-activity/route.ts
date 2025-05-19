
import { type NextRequest, NextResponse } from 'next/server';
import { JWT_SECRET } from '../../../../../lib/authConstants'; // Corrected relative path
import jwt from 'jsonwebtoken';
// import { pool } from '@/lib/db'; // For when you connect to the DB

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


// TODO: Replace this with your actual admin authentication logic
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

interface ChapterActivity {
  id: string;
  name: string;
  ridesThisMonth: number;
  membersCount: number;
  isBelowThreshold: boolean;
}

const MIN_MONTHLY_RIDES_THRESHOLD = 2; // Define threshold here or fetch from config

export async function GET(request: NextRequest) {
  const adminAuth = await checkAdminStatus(request);
  if (!adminAuth.isAdmin) {
    return NextResponse.json({ message: adminAuth.error || 'Forbidden: Administrator access required.' }, { status: adminAuth.status || 403 });
  }

    // TODO: Replace with actual database queries
    // You'll need to:
    // 1. Fetch chapters/groups.
    // 2. For each chapter, count rides this month.
    // 3. Count members in each chapter.
    // 4. Determine if isBelowThreshold.
    const mockChapterActivity: ChapterActivity[] = [
      { id: 'chapter1', name: 'Downtown Riders', ridesThisMonth: 6, membersCount: 35, isBelowThreshold: false },
      { id: 'chapter2', name: 'Westside Wheelers', ridesThisMonth: 1, membersCount: 12, isBelowThreshold: true },
      { id: 'chapter3', name: 'North County Cruisers', ridesThisMonth: 3, membersCount: 28, isBelowThreshold: false },
      { id: 'chapter4', name: 'South Bay Rollers', ridesThisMonth: 0, membersCount: 8, isBelowThreshold: true },
    ];

    return NextResponse.json(mockChapterActivity, { status: 200 });
}
