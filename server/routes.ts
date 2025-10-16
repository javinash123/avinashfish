import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema, insertSliderImageSchema, updateSliderImageSchema, updateSiteSettingsSchema, insertSponsorSchema, updateSponsorSchema, insertNewsSchema, updateNewsSchema, insertGalleryImageSchema, updateGalleryImageSchema, insertCompetitionSchema, updateCompetitionSchema, insertCompetitionParticipantSchema, insertLeaderboardEntrySchema, updateLeaderboardEntrySchema } from "@shared/schema";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import "./types"; // Import session types

// Stripe integration for payment processing
// Requires STRIPE_SECRET_KEY environment variable
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-09-30.clover" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Whitelist of allowed upload types to prevent directory traversal
  const ALLOWED_UPLOAD_TYPES = ['slider', 'news', 'gallery', 'sponsors', 'logo'] as const;
  type AllowedUploadType = typeof ALLOWED_UPLOAD_TYPES[number];
  
  const sanitizeUploadType = (type: string): AllowedUploadType => {
    const sanitized = type.toLowerCase().trim();
    if (ALLOWED_UPLOAD_TYPES.includes(sanitized as AllowedUploadType)) {
      return sanitized as AllowedUploadType;
    }
    // Default to 'gallery' if invalid type provided
    return 'gallery';
  };

  // Configure multer for file uploads
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      const rawType = req.body.type || 'gallery';
      const type = sanitizeUploadType(rawType);
      const uploadPath = path.join(process.cwd(), 'attached_assets', 'uploads', type);
      
      // Security check: ensure the resolved path is within our upload directory
      const baseUploadDir = path.join(process.cwd(), 'attached_assets', 'uploads');
      const resolvedPath = path.resolve(uploadPath);
      
      if (!resolvedPath.startsWith(path.resolve(baseUploadDir))) {
        return cb(new Error('Invalid upload path'), '');
      }
      
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({ 
    storage: storage_config,
    fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const rawType = req.body.type || 'gallery';
      const type = sanitizeUploadType(rawType);
      const fileName = req.file.filename;
      const fileUrl = `/assets/uploads/${type}/${fileName}`;

      res.json({ 
        url: fileUrl,
        filename: fileName,
        message: "File uploaded successfully" 
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "File upload failed: " + error.message });
    }
  });

  // Competition pricing - in production, this should come from database
  // TODO: Move to database when competitions table is implemented
  const competitionPricing: Record<string, { entryFee: number; bookingFee: number }> = {
    "1": { entryFee: 45.00, bookingFee: 2.00 },
    "2": { entryFee: 65.00, bookingFee: 2.00 },
    "3": { entryFee: 25.00, bookingFee: 2.00 },
  };

  // Stripe payment intent route for competition bookings
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        message: "Payment processing is not configured. Please set up Stripe API keys." 
      });
    }

    try {
      const { competitionId, competitionName } = req.body;
      
      if (!competitionId) {
        return res.status(400).json({ 
          message: "Competition ID is required" 
        });
      }

      // Get authoritative pricing from server - NEVER trust client-sent amounts
      const pricing = competitionPricing[competitionId];
      if (!pricing) {
        return res.status(404).json({ 
          message: "Competition not found" 
        });
      }

      // Calculate total on server side only
      const totalAmount = pricing.entryFee + pricing.bookingFee;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to pence (GBP uses pence like USD uses cents)
        currency: "gbp", // UK currency
        metadata: {
          competitionId,
          competitionName: competitionName || "Unknown Competition",
          entryFee: pricing.entryFee.toString(),
          bookingFee: pricing.bookingFee.toString(),
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount, // Send back the server-calculated amount for display only
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const admin = await storage.getAdminByEmail(email);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // In production, use proper session management or JWT
      // For now, we'll store admin ID in session
      req.session.adminId = admin.id;
      
      // Explicitly save the session before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        
        res.json({
          id: admin.id,
          email: admin.email,
          name: admin.name,
        });
      });
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed: " + error.message });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/admin/me", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const admin = await storage.getAdmin(adminId);
      
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({
        id: admin.id,
        email: admin.email,
        name: admin.name,
      });
    } catch (error: any) {
      console.error("Get admin error:", error);
      res.status(500).json({ message: "Error fetching admin: " + error.message });
    }
  });

  app.put("/api/admin/profile", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { email, name, currentPassword, newPassword } = req.body;
      
      const admin = await storage.getAdmin(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword || admin.password !== currentPassword) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      const updatedAdmin = await storage.updateAdmin(adminId, {
        email,
        name,
        newPassword,
      });

      if (!updatedAdmin) {
        return res.status(500).json({ message: "Failed to update profile" });
      }

      res.json({
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
      });
    } catch (error: any) {
      console.error("Update admin profile error:", error);
      res.status(500).json({ message: "Error updating profile: " + error.message });
    }
  });

  // Admin angler management routes
  app.get("/api/admin/anglers", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const anglers = await storage.getAllUsers();
      
      res.json(anglers.map(angler => ({
        id: angler.id,
        firstName: angler.firstName,
        lastName: angler.lastName,
        username: angler.username,
        email: angler.email,
        club: angler.club,
        status: angler.status,
        createdAt: angler.createdAt,
      })));
    } catch (error: any) {
      console.error("Get anglers error:", error);
      res.status(500).json({ message: "Error fetching anglers: " + error.message });
    }
  });

  app.patch("/api/admin/anglers/:id/status", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["active", "pending", "blocked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'active', 'pending', or 'blocked'" });
      }

      const updatedUser = await storage.updateUserStatus(id, status as "active" | "pending" | "blocked");

      if (!updatedUser) {
        return res.status(404).json({ message: "Angler not found" });
      }

      res.json({
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        status: updatedUser.status,
      });
    } catch (error: any) {
      console.error("Update angler status error:", error);
      res.status(500).json({ message: "Error updating angler status: " + error.message });
    }
  });

  // User/Angler authentication routes
  app.post("/api/user/register", async (req, res) => {
    try {
      const result = registerUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: result.error.errors 
        });
      }

      const { email, username } = result.data;

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const user = await storage.createUser(result.data);

      console.log("[DEBUG register] Before setting session:", { existingUserId: req.session?.userId, existingAdminId: req.session?.adminId, newUserId: user.id });
      req.session.userId = user.id;
      console.log("[DEBUG register] After setting session:", { userId: req.session?.userId, adminId: req.session?.adminId });

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }

        res.json({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          club: user.club,
          status: user.status,
        });
      });
    } catch (error: any) {
      console.error("User registration error:", error);
      res.status(500).json({ message: "Registration failed: " + error.message });
    }
  });

  app.post("/api/user/login", async (req, res) => {
    try {
      const result = loginUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid login data", 
          errors: result.error.errors 
        });
      }

      const { email, password } = result.data;

      const user = await storage.getUserByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.status === "blocked") {
        return res.status(403).json({ message: "Your account has been blocked" });
      }

      req.session.userId = user.id;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }

        res.json({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          club: user.club,
          status: user.status,
        });
      });
    } catch (error: any) {
      console.error("User login error:", error);
      res.status(500).json({ message: "Login failed: " + error.message });
    }
  });

  app.post("/api/user/logout", async (req, res) => {
    req.session.userId = undefined;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user/me", async (req, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Error fetching user: " + error.message });
    }
  });

  app.get("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, email, ...userPublicData } = user;

      res.json(userPublicData);
    } catch (error: any) {
      console.error("Get user by username error:", error);
      res.status(500).json({ message: "Error fetching user: " + error.message });
    }
  });

  app.get("/api/user/participations", async (req, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const participations = await storage.getUserParticipations(userId);
      
      // Enrich with competition data
      const enrichedParticipations = await Promise.all(
        participations.map(async (participation) => {
          const competition = await storage.getCompetition(participation.competitionId);
          return {
            ...participation,
            competition,
          };
        })
      );

      res.json(enrichedParticipations);
    } catch (error: any) {
      console.error("Get user participations error:", error);
      res.status(500).json({ message: "Error fetching participations: " + error.message });
    }
  });

  app.get("/api/user/stats", async (req, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const leaderboardEntries = await storage.getUserLeaderboardEntries(userId);
      
      // Calculate statistics
      const wins = leaderboardEntries.filter(entry => entry.position === 1).length;
      const podiumFinishes = leaderboardEntries.filter(entry => entry.position && entry.position <= 3).length;
      
      // Calculate best catch (highest weight)
      const weights = leaderboardEntries
        .map(entry => parseFloat(entry.weight))
        .filter(weight => !isNaN(weight));
      
      const bestCatch = weights.length > 0 ? Math.max(...weights) : 0;
      const averageWeight = weights.length > 0 
        ? weights.reduce((sum, weight) => sum + weight, 0) / weights.length 
        : 0;
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

      res.json({
        wins,
        podiumFinishes,
        bestCatch: bestCatch > 0 ? `${bestCatch.toFixed(2)}kg` : "-",
        averageWeight: averageWeight > 0 ? `${averageWeight.toFixed(2)}kg` : "-",
        totalWeight: totalWeight > 0 ? `${totalWeight.toFixed(2)}kg` : "-",
        totalCompetitions: leaderboardEntries.length,
      });
    } catch (error: any) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Error fetching stats: " + error.message });
    }
  });

  // Admin anglers management routes
  app.get("/api/admin/anglers", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const users = await storage.getAllUsers();
      const anglersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(anglersWithoutPasswords);
    } catch (error: any) {
      console.error("Error fetching anglers:", error);
      res.status(500).json({ message: "Error fetching anglers: " + error.message });
    }
  });

  app.patch("/api/admin/anglers/:id/status", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { status } = req.body;
      if (!status || !["active", "pending", "blocked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await storage.updateUserStatus(req.params.id, status);
      if (!user) {
        return res.status(404).json({ message: "Angler not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating angler status:", error);
      res.status(500).json({ message: "Error updating angler status: " + error.message });
    }
  });

  app.get("/api/admin/anglers/:id/stats", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.params.id;
      const participations = await storage.getUserParticipations(userId);
      const leaderboardEntries = await storage.getUserLeaderboardEntries(userId);
      
      // Calculate statistics
      const wins = leaderboardEntries.filter(entry => entry.position === 1).length;
      const podiumFinishes = leaderboardEntries.filter(entry => entry.position && entry.position <= 3).length;
      
      // Calculate best catch (highest weight)
      const weights = leaderboardEntries
        .map(entry => parseFloat(entry.weight))
        .filter(weight => !isNaN(weight));
      
      const bestCatch = weights.length > 0 ? Math.max(...weights) : 0;
      const averageWeight = weights.length > 0 
        ? weights.reduce((sum, weight) => sum + weight, 0) / weights.length 
        : 0;
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

      res.json({
        totalMatches: participations.length,
        wins,
        podiumFinishes,
        bestCatch: bestCatch > 0 ? `${bestCatch.toFixed(2)}kg` : "-",
        avgWeight: averageWeight > 0 ? `${averageWeight.toFixed(2)}kg` : "-",
        totalWeight: totalWeight > 0 ? `${totalWeight.toFixed(2)}kg` : "-",
      });
    } catch (error: any) {
      console.error("Error fetching angler stats:", error);
      res.status(500).json({ message: "Error fetching angler stats: " + error.message });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/dashboard/stats", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const users = await storage.getAllUsers();
      const competitions = await storage.getAllCompetitions();
      const allParticipations = await storage.getAllParticipants();
      
      // Helper function to compute competition status
      const getCompetitionStatus = (comp: any): string => {
        const now = new Date();
        const compDateTime = new Date(`${comp.date}T${comp.time}`);
        
        if (compDateTime < now) {
          return "completed";
        }
        
        const hoursUntilComp = (compDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilComp <= 24 && hoursUntilComp >= 0) {
          return "live";
        }
        
        return "upcoming";
      };

      const activeCompetitions = competitions.filter(comp => 
        getCompetitionStatus(comp) === "live" || getCompetitionStatus(comp) === "upcoming"
      ).length;

      // Get today's participations
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingsToday = allParticipations.filter(p => {
        const joinedDate = new Date(p.joinedAt);
        joinedDate.setHours(0, 0, 0, 0);
        return joinedDate.getTime() === today.getTime();
      }).length;

      // Calculate total revenue (this month's entry fees)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const thisMonthParticipations = allParticipations.filter(p => {
        const joinedDate = new Date(p.joinedAt);
        return joinedDate >= thisMonth;
      });

      let totalRevenue = 0;
      for (const participation of thisMonthParticipations) {
        const competition = competitions.find(c => c.id === participation.competitionId);
        if (competition) {
          totalRevenue += parseFloat(competition.entryFee);
        }
      }

      res.json({
        totalAnglers: users.length,
        activeCompetitions,
        totalRevenue: `£${totalRevenue.toFixed(0)}`,
        bookingsToday,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard stats: " + error.message });
    }
  });

  // Admin recent participations
  app.get("/api/admin/recent-participations", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const allParticipations = await storage.getAllParticipants();
      const competitions = await storage.getAllCompetitions();
      const users = await storage.getAllUsers();
      
      // Sort by joinedAt descending and take top 10
      const recentParticipations = allParticipations
        .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
        .slice(0, 10)
        .map(participation => {
          const user = users.find(u => u.id === participation.userId);
          const competition = competitions.find(c => c.id === participation.competitionId);
          
          return {
            id: participation.id,
            anglerName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
            competitionName: competition?.name || "Unknown Competition",
            pegNumber: participation.pegNumber,
            joinedAt: participation.joinedAt,
          };
        });

      res.json(recentParticipations);
    } catch (error: any) {
      console.error("Error fetching recent participations:", error);
      res.status(500).json({ message: "Error fetching recent participations: " + error.message });
    }
  });

  // Slider images routes (public access for display)
  app.get("/api/slider-images", async (req, res) => {
    try {
      const images = await storage.getAllSliderImages();
      const activeImages = images.filter(img => img.isActive);
      res.json(activeImages);
    } catch (error: any) {
      console.error("Error fetching slider images:", error);
      res.status(500).json({ message: "Error fetching slider images: " + error.message });
    }
  });

  // Admin slider images management routes
  app.get("/api/admin/slider-images", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const images = await storage.getAllSliderImages();
      res.json(images);
    } catch (error: any) {
      console.error("Error fetching slider images:", error);
      res.status(500).json({ message: "Error fetching slider images: " + error.message });
    }
  });
  app.post("/api/admin/slider-images", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertSliderImageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const image = await storage.createSliderImage(result.data);
      res.json(image);
    } catch (error: any) {
      console.error("Error creating slider image:", error);
      res.status(500).json({ message: "Error creating slider image: " + error.message });
    }
  });

  app.put("/api/admin/slider-images/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateSliderImageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const image = await storage.updateSliderImage(req.params.id, result.data);
      if (!image) {
        return res.status(404).json({ message: "Slider image not found" });
      }

      res.json(image);
    } catch (error: any) {
      console.error("Error updating slider image:", error);
      res.status(500).json({ message: "Error updating slider image: " + error.message });
    }
  });

  app.delete("/api/admin/slider-images/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteSliderImage(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Slider image not found" });
      }

      res.json({ message: "Slider image deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting slider image:", error);
      res.status(500).json({ message: "Error deleting slider image: " + error.message });
    }
  });

  // Site settings routes
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Error fetching site settings: " + error.message });
    }
  });

  app.put("/api/admin/site-settings", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateSiteSettingsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const settings = await storage.updateSiteSettings(result.data);
      if (!settings) {
        return res.status(404).json({ message: "Site settings not found" });
      }

      res.json(settings);
    } catch (error: any) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ message: "Error updating site settings: " + error.message });
    }
  });

  // Sponsors routes (public access for display)
  app.get("/api/sponsors", async (req, res) => {
    try {
      const sponsors = await storage.getAllSponsors();
      res.json(sponsors);
    } catch (error: any) {
      console.error("Error fetching sponsors:", error);
      res.status(500).json({ message: "Error fetching sponsors: " + error.message });
    }
  });

  // Admin sponsors management routes
  app.post("/api/admin/sponsors", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertSponsorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const sponsor = await storage.createSponsor(result.data);
      res.json(sponsor);
    } catch (error: any) {
      console.error("Error creating sponsor:", error);
      res.status(500).json({ message: "Error creating sponsor: " + error.message });
    }
  });

  app.put("/api/admin/sponsors/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateSponsorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const sponsor = await storage.updateSponsor(req.params.id, result.data);
      if (!sponsor) {
        return res.status(404).json({ message: "Sponsor not found" });
      }

      res.json(sponsor);
    } catch (error: any) {
      console.error("Error updating sponsor:", error);
      res.status(500).json({ message: "Error updating sponsor: " + error.message });
    }
  });

  app.delete("/api/admin/sponsors/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteSponsor(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Sponsor not found" });
      }

      res.json({ message: "Sponsor deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting sponsor:", error);
      res.status(500).json({ message: "Error deleting sponsor: " + error.message });
    }
  });

  // News routes (public access for display)
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error: any) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Error fetching news: " + error.message });
    }
  });

  // Admin news management routes
  app.post("/api/admin/news", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertNewsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const newsItem = await storage.createNews(result.data);
      res.json(newsItem);
    } catch (error: any) {
      console.error("Error creating news:", error);
      res.status(500).json({ message: "Error creating news: " + error.message });
    }
  });

  app.put("/api/admin/news/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateNewsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const newsItem = await storage.updateNews(req.params.id, result.data);
      if (!newsItem) {
        return res.status(404).json({ message: "News not found" });
      }

      res.json(newsItem);
    } catch (error: any) {
      console.error("Error updating news:", error);
      res.status(500).json({ message: "Error updating news: " + error.message });
    }
  });

  app.delete("/api/admin/news/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteNews(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "News not found" });
      }

      res.json({ message: "News deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting news:", error);
      res.status(500).json({ message: "Error deleting news: " + error.message });
    }
  });

  // Gallery routes (public access for display)
  app.get("/api/gallery", async (req, res) => {
    try {
      const images = await storage.getAllGalleryImages();
      res.json(images);
    } catch (error: any) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ message: "Error fetching gallery images: " + error.message });
    }
  });

  // Admin gallery management routes
  app.post("/api/admin/gallery", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertGalleryImageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const image = await storage.createGalleryImage(result.data);
      res.json(image);
    } catch (error: any) {
      console.error("Error creating gallery image:", error);
      res.status(500).json({ message: "Error creating gallery image: " + error.message });
    }
  });

  app.put("/api/admin/gallery/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateGalleryImageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const image = await storage.updateGalleryImage(req.params.id, result.data);
      if (!image) {
        return res.status(404).json({ message: "Gallery image not found" });
      }

      res.json(image);
    } catch (error: any) {
      console.error("Error updating gallery image:", error);
      res.status(500).json({ message: "Error updating gallery image: " + error.message });
    }
  });

  app.delete("/api/admin/gallery/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteGalleryImage(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Gallery image not found" });
      }

      res.json({ message: "Gallery image deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ message: "Error deleting gallery image: " + error.message });
    }
  });

  // Competition routes (public access for display)
  app.get("/api/competitions", async (req, res) => {
    try {
      const competitions = await storage.getAllCompetitions();
      res.json(competitions);
    } catch (error: any) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Error fetching competitions: " + error.message });
    }
  });

  app.get("/api/competitions/:id", async (req, res) => {
    try {
      const competition = await storage.getCompetition(req.params.id);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      res.json(competition);
    } catch (error: any) {
      console.error("Error fetching competition:", error);
      res.status(500).json({ message: "Error fetching competition: " + error.message });
    }
  });

  // Admin competition management routes
  app.post("/api/admin/competitions", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertCompetitionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const competition = await storage.createCompetition(result.data);
      res.json(competition);
    } catch (error: any) {
      console.error("Error creating competition:", error);
      res.status(500).json({ message: "Error creating competition: " + error.message });
    }
  });

  app.put("/api/admin/competitions/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateCompetitionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const competition = await storage.updateCompetition(req.params.id, result.data);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      res.json(competition);
    } catch (error: any) {
      console.error("Error updating competition:", error);
      res.status(500).json({ message: "Error updating competition: " + error.message });
    }
  });

  app.delete("/api/admin/competitions/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteCompetition(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Competition not found" });
      }

      res.json({ message: "Competition deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting competition:", error);
      res.status(500).json({ message: "Error deleting competition: " + error.message });
    }
  });

  // Admin peg assignment route
  app.post("/api/admin/competitions/:id/assign-pegs", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { assignments } = req.body; // Array of { participantId, pegNumber }
      
      if (!Array.isArray(assignments)) {
        return res.status(400).json({ message: "Assignments must be an array" });
      }

      // Update each participant's peg number
      const results = await Promise.all(
        assignments.map(async ({ participantId, pegNumber }) => {
          return await storage.updateParticipantPeg(participantId, pegNumber);
        })
      );

      res.json({ 
        message: "Pegs assigned successfully", 
        updated: results.filter(r => r !== undefined).length 
      });
    } catch (error: any) {
      console.error("Error assigning pegs:", error);
      res.status(500).json({ message: "Error assigning pegs: " + error.message });
    }
  });

  // Competition Participant routes
  app.get("/api/competitions/:id/participants", async (req, res) => {
    try {
      const participants = await storage.getCompetitionParticipants(req.params.id);
      
      // Enrich participants with user data
      const enrichedParticipants = await Promise.all(
        participants.map(async (participant) => {
          const user = await storage.getUser(participant.userId);
          return {
            id: participant.id,
            userId: participant.userId,
            pegNumber: participant.pegNumber,
            name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
            username: user?.username || "",
            club: user?.club || "",
            avatar: user?.avatar || "",
            joinedAt: participant.joinedAt,
          };
        })
      );
      
      res.json(enrichedParticipants);
    } catch (error: any) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Error fetching participants: " + error.message });
    }
  });

  app.post("/api/competitions/:id/join", async (req, res) => {
    try {
      const userId = req.session?.userId;
      console.log("[DEBUG join] Session:", { userId, adminId: req.session?.adminId, competitionId: req.params.id });
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const competitionId = req.params.id;
      
      // Check if competition exists
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      // Check if user is already in the competition
      const isAlreadyIn = await storage.isUserInCompetition(competitionId, userId);
      console.log("[DEBUG join] Already in competition?", { userId, competitionId, isAlreadyIn });
      if (isAlreadyIn) {
        return res.status(400).json({ message: "Already joined this competition" });
      }

      // Check if there are available pegs
      const availablePegs = await storage.getAvailablePegs(competitionId);
      if (availablePegs.length === 0) {
        return res.status(400).json({ message: "No available pegs" });
      }

      // Get peg number from request or assign first available
      const pegNumber = req.body.pegNumber || availablePegs[0];
      
      // Validate peg number is available
      if (!availablePegs.includes(pegNumber)) {
        return res.status(400).json({ message: "Peg not available" });
      }

      const participant = await storage.joinCompetition({
        competitionId,
        userId,
        pegNumber,
      });
      
      console.log("[DEBUG join] Participant created:", { participantId: participant.id, userId: participant.userId, competitionId: participant.competitionId, pegNumber: participant.pegNumber });

      res.json(participant);
    } catch (error: any) {
      console.error("Error joining competition:", error);
      res.status(500).json({ message: "Error joining competition: " + error.message });
    }
  });

  app.delete("/api/competitions/:id/leave", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.leaveCompetition(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Not in this competition" });
      }

      res.json({ message: "Left competition successfully" });
    } catch (error: any) {
      console.error("Error leaving competition:", error);
      res.status(500).json({ message: "Error leaving competition: " + error.message });
    }
  });

  app.get("/api/competitions/:id/available-pegs", async (req, res) => {
    try {
      const availablePegs = await storage.getAvailablePegs(req.params.id);
      res.json(availablePegs);
    } catch (error: any) {
      console.error("Error fetching available pegs:", error);
      res.status(500).json({ message: "Error fetching available pegs: " + error.message });
    }
  });

  app.get("/api/competitions/:id/is-joined", async (req, res) => {
    try {
      const userId = req.session?.userId;
      console.log("[DEBUG is-joined] Session:", { userId, adminId: req.session?.adminId, competitionId: req.params.id });
      
      if (!userId) {
        console.log("[DEBUG is-joined] No userId in session, returning false");
        return res.json({ isJoined: false });
      }

      const isJoined = await storage.isUserInCompetition(req.params.id, userId);
      console.log("[DEBUG is-joined] Result:", { userId, competitionId: req.params.id, isJoined });
      res.json({ isJoined });
    } catch (error: any) {
      console.error("Error checking if joined:", error);
      res.status(500).json({ message: "Error checking if joined: " + error.message });
    }
  });

  // Leaderboard routes
  app.get("/api/competitions/:id/leaderboard", async (req, res) => {
    try {
      const entries = await storage.getLeaderboard(req.params.id);
      
      // Enrich leaderboard with user data
      const enrichedEntries = await Promise.all(
        entries.map(async (entry) => {
          const user = await storage.getUser(entry.userId);
          return {
            position: entry.position,
            anglerName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
            username: user?.username || "",
            pegNumber: entry.pegNumber,
            weight: entry.weight,
            club: user?.club || "",
          };
        })
      );
      
      res.json(enrichedEntries);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Error fetching leaderboard: " + error.message });
    }
  });

  // Admin leaderboard management routes
  app.post("/api/admin/leaderboard", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertLeaderboardEntrySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const entry = await storage.createLeaderboardEntry(result.data);
      res.json(entry);
    } catch (error: any) {
      console.error("Error creating leaderboard entry:", error);
      res.status(500).json({ message: "Error creating leaderboard entry: " + error.message });
    }
  });

  app.put("/api/admin/leaderboard/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateLeaderboardEntrySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }

      const entry = await storage.updateLeaderboardEntry(req.params.id, result.data);
      if (!entry) {
        return res.status(404).json({ message: "Leaderboard entry not found" });
      }

      res.json(entry);
    } catch (error: any) {
      console.error("Error updating leaderboard entry:", error);
      res.status(500).json({ message: "Error updating leaderboard entry: " + error.message });
    }
  });

  app.delete("/api/admin/leaderboard/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteLeaderboardEntry(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Leaderboard entry not found" });
      }

      res.json({ message: "Leaderboard entry deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting leaderboard entry:", error);
      res.status(500).json({ message: "Error deleting leaderboard entry: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
