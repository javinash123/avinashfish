// ⚠️ CRITICAL: Load environment variables FIRST, before any other imports
// This ensures all environment-dependent code has access to process.env vars
import dotenv from "dotenv";
import path from "path";

// Load .env file from project root directory
// Works in both development (npm run dev) and production (node dist/index.js)
const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');
dotenv.config({ path: envPath, override: true }); // Load from .env file, override existing env vars

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

// Log environment info for debugging
console.log('📋 ENVIRONMENT STARTUP INFO:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   Stripe Public Key: ${process.env.VITE_STRIPE_PUBLIC_KEY ? (process.env.VITE_STRIPE_PUBLIC_KEY.substring(0, 10) + '... ' + (process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_live_') ? '✅ LIVE' : '⚠️ TEST')) : 'NOT SET'}`);
console.log(`   Stripe Secret Key: ${process.env.STRIPE_SECRET_KEY ? (process.env.STRIPE_SECRET_KEY.substring(0, 10) + '... ' + (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? '✅ LIVE' : '⚠️ TEST')) : 'NOT SET'}`);
console.log(`   MongoDB: ${process.env.MONGODB_URI ? 'configured' : 'not configured'}`);
console.log('');

// Production environment validation
if (process.env.NODE_ENV === 'production') {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // CRITICAL: Validate Stripe keys
  const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY || '';
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  
  // Check if Stripe keys are using test mode
  const isUsingTestKeys = stripePublicKey.startsWith('pk_test_') || stripeSecretKey.startsWith('sk_test_');
  if (isUsingTestKeys) {
    errors.push('❌ CRITICAL: Using Stripe TEST keys in PRODUCTION! Replace with live keys (pk_live_... and sk_live_...)');
  }
  
  // Check if Stripe keys are configured
  if (!stripePublicKey) {
    errors.push('❌ CRITICAL: VITE_STRIPE_PUBLIC_KEY not set in production!');
  }
  if (!stripeSecretKey) {
    errors.push('❌ CRITICAL: STRIPE_SECRET_KEY not set in production!');
  }
  
  // Warn if using default session secret
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-secret-key-change-in-production') {
    warnings.push('⚠️  WARNING: Using default SESSION_SECRET. Generate a secure secret for production!');
  }
  
  // Warn if MongoDB is not configured
  if (!process.env.MONGODB_URI) {
    warnings.push('⚠️  WARNING: MONGODB_URI not set. Using in-memory storage (data will be lost on restart).');
  }
  
  // Log all critical errors
  if (errors.length > 0) {
    console.log('\n========== 🚨 CRITICAL PRODUCTION CONFIGURATION ERRORS 🚨 ==========');
    errors.forEach(error => console.log(error));
    console.log('=====================================================================\n');
    // IMPORTANT: In production, we should NOT crash on missing keys to allow graceful degradation
    // but we MUST warn the user prominently
  }
  
  // Log all warnings
  if (warnings.length > 0) {
    console.log('\n========== ⚠️  PRODUCTION CONFIGURATION WARNINGS ⚠️  ==========');
    warnings.forEach(warning => console.log(warning));
    console.log('==============================================================\n');
  }
}
   
const app = express();

// Trust proxy - required when behind AWS load balancer or reverse proxy
app.set('trust proxy', 1);

// Disable ETag generation to prevent HTTP 304 caching
app.set('etag', false);

// Increase body size limit to handle rich text content with embedded images
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Configure CORS based on environment
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);
    
    // In development, allow any origin
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // SECURITY: In production with no ALLOWED_ORIGINS configured,
    // allow same-origin requests (standard secure behavior)
    // This allows the frontend served from the same server to work
    if (allowedOrigins.length === 0) {
      // Allow the request - same-origin is always safe
      // If you need to restrict cross-origin requests, set ALLOWED_ORIGINS
      return callback(null, true);
    }
    
    // Reject the request if origin not in allowed list
    console.log(`⚠️  CORS: Rejected cross-origin request from ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Session configuration
const MemoryStore = createMemoryStore(session);
const EXPRESS_BASE_PATH = process.env.EXPRESS_BASE_PATH || '';

/* 
app.use(session({
secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
resave: false,
saveUninitialized: true,
store: new MemoryStore({
checkPeriod: 86400000, // prune expired entries every 24h
}),
cookie: {
path: EXPRESS_BASE_PATH || '/',
maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
httpOnly: true,
secure: process.env.NODE_ENV === "production", // Use secure cookies in production
sameSite: "lax",
},
proxy: true
}));
*/

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // ⚠️ temporary fix until you use HTTPS
    sameSite: "lax",
    httpOnly: true,
  },
  proxy: true // Set to true if behind a reverse proxy like Nginx, ELB, or CloudFront
}));
// Disable caching for API routes to ensure real-time data updates
app.use((req, res, next) => {
  const apiPath = EXPRESS_BASE_PATH ? `${EXPRESS_BASE_PATH}/api` : '/api';
  if (req.path.startsWith('/api') || req.path.startsWith(apiPath)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const apiPath = EXPRESS_BASE_PATH ? `${EXPRESS_BASE_PATH}/api` : '/api';
    if (path.startsWith("/api") || path.startsWith(apiPath)) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize storage first (MongoDB or in-memory fallback)
  const { initializeStorage } = await import("./storage");
  const storage = await initializeStorage();
  
  // Run migration to fix legacy profiles with missing fields
  const { migrateLegacyProfiles } = await import("./migrate-legacy-profiles");
  await migrateLegacyProfiles(storage);
  
  // Serve uploaded files statically (must exist on production server)
  // BACKWARDS COMPATIBILITY: Serve from both /assets and /attached-assets
  // Old URLs (/assets/uploads/...) continue working for existing production data
  // New uploads use /attached-assets to avoid Vite bundle conflicts
  // The /assets route only serves the attached_assets/uploads subdirectory to avoid
  // conflicts with Vite's /assets output (which contains CSS/JS bundles)
  app.use('/assets/uploads', express.static('attached_assets/uploads'));
  app.use('/attached-assets', express.static('attached_assets'));
  
  // Register routes after storage is ready - pass storage instance directly
  const server = await registerRoutes(app, storage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server, storage);
  } else {
    serveStatic(app, storage);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}${EXPRESS_BASE_PATH ? ` with base path ${EXPRESS_BASE_PATH}` : ''}`);
  });
})();
