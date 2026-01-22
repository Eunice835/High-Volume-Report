import { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import { storage } from "./storage";
import type { UserRole } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
    email: string;
    role: UserRole;
    csrfToken: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

const PgSession = connectPgSimple(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "ira-analytics-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  name: "ira.sid",
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  
  const headerToken = req.headers["x-csrf-token"] as string;
  const sessionToken = req.session?.csrfToken;
  
  if (!headerToken || !sessionToken || headerToken !== sessionToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId || !req.session?.username || !req.session?.email || !req.session?.role) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  req.user = {
    id: req.session.userId,
    username: req.session.username,
    email: req.session.email,
    role: req.session.role,
  };
  
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId || !req.session?.username || !req.session?.email || !req.session?.role) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!allowedRoles.includes(req.session.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    req.user = {
      id: req.session.userId,
      username: req.session.username,
      email: req.session.email,
      role: req.session.role,
    };
    
    next();
  };
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createDefaultAdmin(): Promise<void> {
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    const passwordHash = await hashPassword("Admin_123");
    await storage.createUser({
      username: "admin",
      email: "admin@ira.local",
      passwordHash,
      role: "admin",
      isActive: 1,
    });
    console.log("Default admin user created");
  }
}

export function setupAuthRoutes(app: any) {
  app.get("/api/auth/session", (req: Request, res: Response) => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken();
    }
    
    if (req.session.userId) {
      return res.json({
        authenticated: true,
        user: {
          id: req.session.userId,
          username: req.session.username,
          email: req.session.email,
          role: req.session.role,
        },
        csrfToken: req.session.csrfToken,
      });
    }
    
    return res.json({
      authenticated: false,
      csrfToken: req.session.csrfToken,
    });
  });

  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValid = await verifyPassword(password, user.passwordHash);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      await storage.updateUserLastLogin(user.id);
      
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.email = user.email;
      req.session.role = user.role;
      req.session.csrfToken = generateCsrfToken();
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        csrfToken: req.session.csrfToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("ira.sid");
      return res.json({ success: true });
    });
  });

  app.post("/api/auth/register", authLimiter, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { username, email, password, role } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        passwordHash,
        role: role || "viewer",
        isActive: 1,
      });
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.get("/api/auth/users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json({
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          lastLogin: u.lastLogin,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ error: "Failed to get users" });
    }
  });
}
