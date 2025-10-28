import "express-session";
import type { Staff } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
    userId?: string;
    staffId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      staff?: Staff;
    }
  }
}
