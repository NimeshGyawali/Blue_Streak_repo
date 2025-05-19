
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// TODO: Import your PostgreSQL client (e.g., 'pg') and database connection setup
// import { pool } from '@/lib/db'; // Example path to your DB setup
// TODO: Import a password hashing library (e.g., 'bcryptjs')
// import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.errors }, { status: 400 });
    }

    const { email, password } = validation.data;

    // --- TODO: PostgreSQL Logic ---
    // 1. Connect to your PostgreSQL database
    // const client = await pool.connect();
    // try {
    //   // 2. Find the user by email
    //   const result = await client.query('SELECT id, name, email, password_hash, city, bike_model, vin, is_captain, avatar_url FROM users WHERE email = $1', [email]);
    //   const user = result.rows[0];
    //
    //   if (!user) {
    //     return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    //   }
    //
    //   // 3. Compare the provided password with the stored hashed password
    //   // const passwordMatch = await bcrypt.compare(password, user.password_hash);
    //   // if (!passwordMatch) {
    //   //   return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    //   // }
    //
    //   // 4. If credentials are valid, generate a session/token (e.g., JWT)
    //   //    and return user data (excluding password)
    //   const { password_hash, ...userWithoutPassword } = user;
    //   //   return NextResponse.json({ message: 'Login successful!', user: userWithoutPassword, token: 'YOUR_GENERATED_JWT_TOKEN' }, { status: 200 });
    //
    // } finally {
    //   client.release();
    // }
    // --- End PostgreSQL Logic ---

    // Placeholder response until DB logic is implemented
    console.log('Login attempt:', { email, password });
    // Simulate finding a user and successful login for now
    if (email === "test@example.com" && password === "password") {
        return NextResponse.json({ message: 'Login successful! (Mock Response)', user: { id: 'mockId', name: 'Mock User', email } }, { status: 200 });
    } else {
        return NextResponse.json({ message: 'Invalid email or password. (Mock Response)' }, { status: 401 });
    }

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
