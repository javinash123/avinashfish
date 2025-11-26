=== Peg Slam Production Build ===

SETUP INSTRUCTIONS:
1. Extract this tarball: tar -xzf peg-slam-build.tar.gz
2. Navigate to the directory: cd peg-slam-build
3. Install production dependencies: npm ci --production
4. Set environment variables (see below)
5. Start the server: NODE_ENV=production node dist/index.js

REQUIRED ENVIRONMENT VARIABLES:
- NODE_ENV=production
- MONGODB_URI=<your-mongodb-connection-string>
- SESSION_SECRET=<generate-a-secure-random-string>
- PORT=5000 (or your preferred port)

OPTIONAL ENVIRONMENT VARIABLES:
- ALLOWED_ORIGINS=<comma-separated-list-of-allowed-origins>
- EXPRESS_BASE_PATH=<base-path-for-api>

IMPORTANT NOTES:
- Session configuration is set for AWS EC2 (secure: false until HTTPS is configured)
- The build includes simplified session store (no MemoryStore dependency)
- All routes are prefixed with /api
- Frontend is served from dist/public

PRODUCTION CHECKLIST:
☐ MongoDB is running and connection string is set
☐ SESSION_SECRET is set to a secure random string
☐ Node.js 18+ is installed on your EC2 instance
☐ Port 5000 (or your PORT env var) is open in security group
☐ attached_assets/ directory exists and has correct permissions
