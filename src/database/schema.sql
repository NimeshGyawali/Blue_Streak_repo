-- Enable pgcrypto extension if not already enabled (for gen_random_uuid())
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update the 'updated_at' column automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    is_admin BOOLEAN DEFAULT false, -- Added for admin roles
    avatar_url TEXT,               -- Added for user profile pictures
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply the trigger to the users table for 'updated_at'
DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Rides Table
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Flagship', 'Chapter', 'Micro')),
    description TEXT,
    route_start VARCHAR(255) NOT NULL,
    route_end VARCHAR(255) NOT NULL,
    route_map_link TEXT,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    captain_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Approval' CHECK (status IN ('Pending Approval', 'Upcoming', 'Approved', 'Ongoing', 'Completed', 'Cancelled', 'Rejected')),
    thumbnail_url TEXT,
    photo_hints TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- Add rejection_reason TEXT if you want to store reasons for ride rejection
    -- rejection_reason TEXT
);

-- Apply the trigger to the rides table for 'updated_at'
DROP TRIGGER IF EXISTS set_timestamp_rides ON rides;
CREATE TRIGGER set_timestamp_rides
BEFORE UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Ride Participants Table (Many-to-Many relationship between Users and Rides)
CREATE TABLE IF NOT EXISTS ride_participants (
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ride_id, user_id)
);

-- Ride Photos Table
CREATE TABLE IF NOT EXISTS ride_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    uploader_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    data_ai_hint TEXT, -- For AI-generated images or hints for them
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply the trigger to the ride_photos table for 'updated_at'
DROP TRIGGER IF EXISTS set_timestamp_ride_photos ON ride_photos;
CREATE TRIGGER set_timestamp_ride_photos
BEFORE UPDATE ON ride_photos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL, -- e.g., 'ReportedContent', 'SystemIssue', 'NewCaptainVerification'
    message TEXT NOT NULL,
    details_url TEXT, -- Optional: link to the relevant content/user/ride
    severity VARCHAR(20) DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) DEFAULT 'New' CHECK (status IN ('New', 'Investigating', 'ActionRequired', 'Resolved', 'Dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_by_user_id UUID REFERENCES users(id) DEFAULT NULL, -- Who resolved it
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Apply the trigger to the system_alerts table for 'updated_at'
DROP TRIGGER IF EXISTS set_timestamp_system_alerts ON system_alerts;
CREATE TRIGGER set_timestamp_system_alerts
BEFORE UPDATE ON system_alerts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


-- Optional: Add indexes for frequently queried columns for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_date_time ON rides(date_time);
CREATE INDEX IF NOT EXISTS idx_ride_participants_ride_id ON ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_participants_user_id ON ride_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_photos_ride_id ON ride_photos(ride_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);

-- Example: Add initial admin user (replace with your details and ensure password is HASHED if doing manually, or set is_admin=true for an existing user)
-- INSERT INTO users (name, email, password_hash, is_admin, is_verified)
-- VALUES ('Admin User', 'admin@example.com', 'your_bcrypt_hashed_password_here', true, true)
-- ON CONFLICT (email) DO NOTHING;

-- Note: It's generally better to manage user creation through your signup API and then promote a user to admin manually via SQL:
-- UPDATE users SET is_admin = true, is_verified = true WHERE email = 'admin_email@example.com';
