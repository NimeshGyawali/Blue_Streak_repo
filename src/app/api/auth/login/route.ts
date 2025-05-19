
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = validation.data;

    const client = await pool.connect();
    try {
      // Find the user by email
      const result = await client.query(
        'SELECT id, name, email, password_hash, city, bike_model, vin, is_captain, is_verified, avatar_url FROM users WHERE email = $1', 
        [email.toLowerCase()]
      );
      const user = result.rows[0];

      if (!user) {
        return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
      }

      // Compare the provided password with the stored hashed password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
      }

      // TODO: Check if user is_verified if you have such a policy for login
      // if (!user.is_verified) {
      //   return NextResponse.json({ message: 'Account not verified. Please check your email or contact support.' }, { status: 403 });
      // }

      // If credentials are valid, prepare user data (excluding password)
      // TODO: Generate a session/token (e.g., JWT)
      const { password_hash, ...userWithoutPassword } = user;
      return NextResponse.json({ 
        message: 'Login successful!', 
        user: userWithoutPassword, 
        // token: 'YOUR_GENERATED_JWT_TOKEN' // Placeholder for token
      }, { status: 200 });

    } catch (dbError) {
      console.error('Login DB error:', dbError);
      return NextResponse.json({ message: 'Database error during login.' }, { status: 500 });
    }
    finally {
      client.release();
    }

  } catch (error) {
    console.error('Login API error:', error);
     if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
