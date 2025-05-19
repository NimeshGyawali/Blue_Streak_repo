// src/lib/db.ts
import { Pool } from 'pg';

// Ensure that DATABASE_URL is defined in your environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

let pool: Pool;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // You can add additional pool configuration options here if needed
    // For example, for SSL connections:
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // max: 20, // Max number of clients in the pool
    // idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    // connectionTimeoutMillis: 2000, // How long to wait for a connection to be established
  });

  // Test the connection (optional, but good for immediate feedback during development)
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Error connecting to PostgreSQL database:', err);
    } else {
      console.log('Successfully connected to PostgreSQL database. Current time from DB:', res.rows[0].now);
    }
  });

} catch (error) {
  console.error('Failed to initialize PostgreSQL pool:', error);
  // Depending on your error handling strategy, you might want to exit the process
  // or implement a retry mechanism. For now, we'll re-throw to halt startup if critical.
  throw new Error('Failed to initialize PostgreSQL pool. Check DATABASE_URL and DB accessibility.');
}

export { pool };
