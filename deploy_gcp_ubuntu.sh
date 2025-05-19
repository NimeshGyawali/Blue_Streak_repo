#!/bin/bash

# ---
# Deployment Script for Yamaha Blue Streaks on GCP Ubuntu 20.04 VM
#
# This script will:
# 1. Update system packages.
# 2. Install Node.js (using NVM for flexibility), PM2, Nginx, and PostgreSQL.
# 3. Configure PostgreSQL: create a database and user.
# 4. Set up the Next.js application: install dependencies, build the app.
# 5. Configure Nginx as a reverse proxy for the Next.js app.
# 6. Start the Next.js application using PM2.
#
# Prerequisites:
# - A fresh Ubuntu 20.04 VM instance on GCP.
# - This script and your project code cloned into a directory (e.g., /home/your_user/yamaha-blue-streaks).
# - You have sudo privileges.
# - Ensure ports 80 (HTTP), 443 (HTTPS, if setting up SSL later), and your Next.js app port (default 3000, if accessed directly) are open in GCP Firewall rules.
# ---

# --- Configuration Variables ---
NODE_VERSION="20" # Specify the Node.js version you want to install (e.g., 18, 20)
APP_DIR=$(pwd) # Assumes the script is run from the project root
APP_NAME="yamaha-blue-streaks" # Used for PM2 and Nginx config names
DB_NAME="yamaha_blue_streaks_db"
DB_USER="yamaha_app_user"
# DB_PASSWORD will be prompted

# --- Helper Functions ---
print_success() {
  echo -e "\033[0;32mSUCCESS: $1\033[0m"
}

print_error() {
  echo -e "\033[0;31mERROR: $1\033[0m" >&2
}

print_warning() {
  echo -e "\033[0;33mWARNING: $1\033[0m"
}

print_info() {
  echo -e "\033[0;34mINFO: $1\033[0m"
}

# --- Script Execution ---

# Exit immediately if a command exits with a non-zero status.
set -e

print_info "Starting deployment for $APP_NAME..."

# 1. System Update and Essential Packages
print_info "Updating system packages and installing essentials..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential libssl-dev ufw
print_success "System updated and essential packages installed."

# 2. Install Node.js using NVM (Node Version Manager)
print_info "Installing Node.js version $NODE_VERSION using NVM..."
# Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Source NVM script to make nvm command available in the current session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install the specified Node.js version
nvm install $NODE_VERSION
nvm use $NODE_VERSION
nvm alias default $NODE_VERSION
print_success "Node.js $(node -v) and npm $(npm -v) installed successfully."

# 3. Install PM2 (Process Manager for Node.js)
print_info "Installing PM2 globally..."
npm install pm2 -g
print_success "PM2 installed successfully."

# 4. Install PostgreSQL
print_info "Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib
print_success "PostgreSQL installed."

# 5. Configure PostgreSQL
print_info "Configuring PostgreSQL..."
read -s -p "Enter a password for the new PostgreSQL user '$DB_USER': " DB_PASSWORD
echo
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || print_warning "Database $DB_NAME might already exist."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" || print_warning "User $DB_USER might already exist."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
# Optional: Enable pgcrypto extension if your schema uses gen_random_uuid()
sudo -u postgres psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
print_success "PostgreSQL database '$DB_NAME' and user '$DB_USER' configured."
print_warning "Remember the PostgreSQL password you just set for the .env.local file."

# 6. Set up Application Environment (.env.local)
print_info "Setting up application environment..."
if [ -f ".env.local" ]; then
  print_warning ".env.local file already exists. Please ensure it's correctly configured."
  print_warning "Ensure DATABASE_URL is: postgresql://$DB_USER:YOUR_CHOSEN_PASSWORD@localhost:5432/$DB_NAME?sslmode=disable"
  print_warning "Ensure JWT_SECRET is set to a strong, unique value."
  print_warning "Ensure NEXT_PUBLIC_BASE_URL is set to your VM's IP or domain."
else
  touch .env.local
  echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?sslmode=disable\"" >> .env.local
  JWT_SECRET_VALUE=$(openssl rand -hex 32)
  echo "JWT_SECRET=\"$JWT_SECRET_VALUE\"" >> .env.local
  echo "NEXT_PUBLIC_BASE_URL=\"http://YOUR_VM_IP_OR_DOMAIN\"" >> .env.local # Replace with actual IP/domain
  echo "NODE_ENV=\"production\"" >> .env.local

  print_success ".env.local file created with database connection string and JWT_SECRET."
  print_warning "IMPORTANT: You MUST edit .env.local and replace YOUR_VM_IP_OR_DOMAIN with your VM's actual public IP address or configured domain name for NEXT_PUBLIC_BASE_URL."
  print_warning "Review and adjust other variables in .env.local as needed."
fi

# 7. Install Application Dependencies
print_info "Installing application dependencies from $APP_DIR..."
cd "$APP_DIR"
npm install
print_success "Application dependencies installed."

# 8. Build the Next.js Application
print_info "Building the Next.js application for production..."
npm run build
print_success "Next.js application built."

# 9. Configure Nginx as a Reverse Proxy
print_info "Installing and configuring Nginx..."
sudo apt-get install -y nginx

# Create Nginx server block configuration
NGINX_CONF_FILE="/etc/nginx/sites-available/$APP_NAME"
print_info "Creating Nginx config file at $NGINX_CONF_FILE..."

sudo bash -c "cat > $NGINX_CONF_FILE" <<EOF
server {
    listen 80;
    listen [::]:80;

    # Replace with your server's IP address or domain name
    server_name YOUR_VM_IP_OR_DOMAIN_HERE _; # The underscore makes it the default server

    # Logging
    access_log /var/log/nginx/$APP_NAME.access.log;
    error_log /var/log/nginx/$APP_NAME.error.log;

    location / {
        proxy_pass http://localhost:3000; # Assuming Next.js runs on port 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Serve static files directly from Next.js build output for better performance
    # Adjust the path if your Next.js static assets are served differently
    # location /_next/static {
    #     alias $APP_DIR/.next/static; # Path to your app's static assets
    #     expires 1y;
    #     access_log off;
    #     add_header Cache-Control "public";
    # }

    # location /static { # If you have a public/static folder
    #    alias $APP_DIR/public/static;
    #    expires 1y;
    #    access_log off;
    #    add_header Cache-Control "public";
    # }
}
EOF

# Enable the Nginx configuration
if [ -L "/etc/nginx/sites-enabled/$APP_NAME" ]; then
    print_warning "Nginx site '$APP_NAME' already enabled. Skipping symlink creation."
else
    sudo ln -s "$NGINX_CONF_FILE" "/etc/nginx/sites-enabled/"
    print_success "Nginx site '$APP_NAME' enabled."
fi

# Remove default Nginx config if it exists to avoid conflicts
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    print_info "Removing default Nginx site configuration..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration and restart Nginx
print_info "Testing Nginx configuration..."
sudo nginx -t
print_info "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx # Ensure Nginx starts on boot
print_success "Nginx installed and configured."
print_warning "IMPORTANT: You MUST edit $NGINX_CONF_FILE and replace YOUR_VM_IP_OR_DOMAIN_HERE with your VM's actual public IP address or configured domain name. Then run 'sudo nginx -t && sudo systemctl restart nginx'."

# 10. Configure Firewall (UFW)
print_info "Configuring UFW firewall..."
sudo ufw allow 'OpenSSH' # Ensure SSH access is allowed
sudo ufw allow 'Nginx Full' # Allows HTTP (80) and HTTPS (443)
# If you need to access Node app directly on 3000 for testing (not recommended for production)
# sudo ufw allow 3000/tcp
sudo ufw --force enable # Enable UFW (use --force to bypass confirmation if needed)
print_success "UFW firewall configured and enabled."

# 11. Start the Application with PM2
print_info "Starting the application with PM2..."
# Change to app directory if not already there
cd "$APP_DIR"

# Check if the app is already managed by PM2
pm2 describe "$APP_NAME" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  print_info "Application '$APP_NAME' is already running under PM2. Restarting..."
  pm2 restart "$APP_NAME"
else
  print_info "Starting new PM2 process for '$APP_NAME'..."
  # Start the Next.js app using npm start (which should run next start)
  # The --name flag gives your process a name in PM2
  pm2 start npm --name "$APP_NAME" -- start
fi

# Configure PM2 to start on system boot
# The command pm2 startup generates a command to run.
# This command needs to be run with sudo.
print_info "Configuring PM2 to start on system boot..."
# Generate the startup command
PM2_STARTUP_CMD=$(pm2 startup systemd -u $(whoami) --hp $HOME | tail -n 1)
if [[ "$PM2_STARTUP_CMD" == sudo* ]]; then
    print_warning "To enable PM2 to start on boot, please run the following command manually:"
    print_warning "$PM2_STARTUP_CMD"
    # Optionally, you could attempt to run it if you're sure about script permissions and context
    # echo "Attempting to execute: $PM2_STARTUP_CMD"
    # eval "$PM2_STARTUP_CMD"
else
    print_warning "Could not automatically determine PM2 startup command. Run 'pm2 startup' and follow its instructions."
fi

pm2 save # Save current PM2 process list
print_success "Application '$APP_NAME' started with PM2."
print_info "You can monitor the app with 'pm2 monit' or 'pm2 logs $APP_NAME'."

# --- Final Instructions ---
echo ""
print_success "--- DEPLOYMENT SCRIPT COMPLETED ---"
print_info "Your application should now be accessible via Nginx at http://YOUR_VM_IP_OR_DOMAIN (after Nginx config update)."
print_warning "ACTION REQUIRED:"
print_warning "1. Edit /etc/nginx/sites-available/$APP_NAME and set the correct 'server_name' (replace YOUR_VM_IP_OR_DOMAIN_HERE). Then run 'sudo nginx -t && sudo systemctl restart nginx'."
print_warning "2. Edit $APP_DIR/.env.local and set NEXT_PUBLIC_BASE_URL to your VM's public IP or domain. Then restart the app with 'pm2 restart $APP_NAME'."
print_warning "3. If prompted, run the 'sudo ... pm2 startup ...' command printed during the PM2 setup to enable startup on boot, then run 'pm2 save'."
print_info "To check PM2 status: pm2 list"
print_info "To view logs: pm2 logs $APP_NAME"
print_info "To stop the app: pm2 stop $APP_NAME"
print_info "To restart the app: pm2 restart $APP_NAME"
