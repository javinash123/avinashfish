import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
   
const app = express();
// Disable ETag generation to prevent HTTP 304 caching
app.set('etag', false);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
 app.use(cors({
      origin: 'http://98.84.197.204:7118', // Or an array of allowed origins
      credentials: true // Crucial for sending cookies
    }));
// Session configuration
const MemoryStore = createMemoryStore(session);
const EXPRESS_BASE_PATH = process.env.EXPRESS_BASE_PATH || '';
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
//     resave: false,
//     saveUninitialized: true,
//     store: new MemoryStore({
//       checkPeriod: 86400000, // prune expired entries every 24h
//     }),
//     cookie: {
//       path: EXPRESS_BASE_PATH || '/',
//       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//       httpOnly: false,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//     },
//   })
// );
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
  // Instead of using Router, just pass `app` directly
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
