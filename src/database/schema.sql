
-- Ensure pgcrypto extension is enabled for gen_random_uuid()
-- You might need to run this command separately if you don't have superuser rights
-- or if it's not enabled by default on your Aiven instance.
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    bike_model VARCHAR(255),
    vin VARCHAR(17),
    is_captain BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to users table if they don't exist (for existing setups)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Rides Table
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Flagship', 'Chapter', 'Micro')),
    description TEXT,
    route_start VARCHAR(255),
    route_end VARCHAR(255),
    route_map_link TEXT,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    captain_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Or ON DELETE CASCADE
    status VARCHAR(50) NOT NULL CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'Pending Approval', 'Rejected')),
    thumbnail_url TEXT,
    photo_hints TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ride Participants Table (Many-to-Many relationship between Rides and Users)
CREATE TABLE IF NOT EXISTS ride_participants (
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ride_id, user_id)
);

-- Ride Photos Table
CREATE TABLE IF NOT EXISTS ride_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    uploader_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who uploaded the photo
    photo_url TEXT NOT NULL,
    caption TEXT,
    data_ai_hint TEXT, -- Hint for AI generation if not user-uploaded, or context for user image
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create an index for faster lookups of photos by ride_id
CREATE INDEX IF NOT EXISTS idx_ride_photos_ride_id ON ride_photos(ride_id);

-- Optional: Create an index for faster lookups of rides by status
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);

-- Optional: Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_users') THEN
        CREATE TRIGGER set_timestamp_users
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
END $$;

-- Apply the trigger to rides table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_rides') THEN
        CREATE TRIGGER set_timestamp_rides
        BEFORE UPDATE ON rides
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
END $$;

-- Note: For Aiven or other managed PostgreSQL services,
-- the 'pgcrypto' extension for gen_random_uuid() is usually available.
-- If you encounter errors related to gen_random_uuid(),
-- ensure the extension is enabled for your database.
-- You might need to run: CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- (This usually requires superuser privileges or specific provider settings)

-- Consider adding other indexes based on your query patterns, for example:
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_rides_captain_id ON rides(captain_id);
-- CREATE INDEX IF NOT EXISTS idx_rides_date_time ON rides(date_time);

