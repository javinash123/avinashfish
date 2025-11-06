import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

// Production environment validation
if (process.env.NODE_ENV === 'production') {
  const warnings: string[] = [];
  
  // Warn if using default session secret
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-secret-key-change-in-production') {
    warnings.push('⚠️  WARNING: Using default SESSION_SECRET. Generate a secure secret for production!');
  }
  
  // Warn if MongoDB is not configured
  if (!process.env.MONGODB_URI) {
    warnings.push('⚠️  WARNING: MONGODB_URI not set. Using in-memory storage (data will be lost on restart).');
  }
  
  // Log all warnings
  if (warnings.length > 0) {
    console.log('\n========== PRODUCTION CONFIGURATION WARNINGS ==========');
    warnings.forEach(warning => console.log(warning));
    console.log('========================================================\n');
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
    // reject all cross-origin requests for security
    // The frontend served from the same server will still work (no origin header)
    if (allowedOrigins.length === 0) {
      console.log(`⚠️  CORS: Rejected cross-origin request from ${origin} (no ALLOWED_ORIGINS configured)`);
      return callback(new Error('Not allowed by CORS'));
    }
    
    // Reject the request if origin not allowed
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Session configuration
const MemoryStore = createMemoryStore(session);
const EXPRESS_BASE_PATH = process.env.EXPRESS_BASE_PATH || '';

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
  await initializeStorage();
  
  // Serve uploaded files statically (must exist on production server)
  app.use('/assets', express.static('attached_assets'));
  
  // Register routes after storage is ready
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
