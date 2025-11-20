import type { Express } from "express";
import { createServer, type Server } from "http";
import type { IStorage } from "./storage";
import { insertUserSchema, registerUserSchema, loginUserSchema, forgotPasswordSchema, resetPasswordSchema, updateUserProfileSchema, updateUserPasswordSchema, insertUserGalleryPhotoSchema, insertStaffSchema, updateStaffSchema, staffLoginSchema, updateStaffPasswordSchema, insertSliderImageSchema, updateSliderImageSchema, updateSiteSettingsSchema, insertSponsorSchema, updateSponsorSchema, insertNewsSchema, updateNewsSchema, insertGalleryImageSchema, updateGalleryImageSchema, insertCompetitionSchema, updateCompetitionSchema, insertCompetitionParticipantSchema, insertLeaderboardEntrySchema, updateLeaderboardEntrySchema, anglerDirectoryQuerySchema } from "@shared/schema";
import { sendPasswordResetEmail, sendContactEmail, sendEmailVerification } from "./email";
import { randomBytes, createHash } from "crypto";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import "./types"; // Import session types

// Stripe integration for payment processing
// Requires STRIPE_SECRET_KEY environment variable
// Valid keys start with sk_test_ (test mode) or sk_live_ (production mode)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-09-30.clover" }) : null;

// Validate Stripe key format to catch invalid/placeholder keys early
if (stripe && stripeKey && !stripeKey.startsWith('sk_')) {
  console.warn('⚠️  WARNING: STRIPE_SECRET_KEY appears to be invalid. Valid keys start with sk_test_ or sk_live_');
  console.warn('⚠️  Get your Stripe API keys from: https://dashboard.stripe.com/apikeys');
}

export async function registerRoutes(app: Express, storage: IStorage): Promise<Server> {
  // Use the passed storage instance (guaranteed to be initialized)
  
  // Whitelist of allowed upload types to prevent directory traversal
  const ALLOWED_UPLOAD_TYPES = ['slider', 'news', 'gallery', 'sponsors', 'logo', 'competitions'] as const;
  type AllowedUploadType = typeof ALLOWED_UPLOAD_TYPES[number];
  
  const sanitizeUploadType = (type: string): AllowedUploadType => {
    const sanitized = type.toLowerCase().trim();
    if (ALLOWED_UPLOAD_TYPES.includes(sanitized as AllowedUploadType)) {
      return sanitized as AllowedUploadType;
    }
    // Default to 'gallery' if invalid type provided
    return 'gallery';
  };

  // Configure multer for file uploads - store in temp location first
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      // Use a temp directory for initial upload
      const uploadPath = path.join(process.cwd(), 'attached_assets', 'uploads', 'temp');
      
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
      fileSize: 8 * 1024 * 1024 // 8MB limit for profile gallery and competition images
    }
  });

  // Staff authentication and permission middleware
  const requireStaffAuth = async (req: any, res: any, next: any) => {
    try {
      const staffId = req.session?.staffId || req.session?.adminId; // Support legacy adminId
      
      if (!staffId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Try to get staff member
      const staff = await storage.getStaff(staffId);
      if (staff) {
        req.staff = staff;
        return next();
      }

      // Fallback to legacy admin for backward compatibility
      const admin = await storage.getAdmin(staffId);
      if (admin) {
        // Convert admin to staff format for compatibility
        req.staff = {
          id: admin.id,
          email: admin.email,
          firstName: admin.name.split(' ')[0] || 'Admin',
          lastName: admin.name.split(' ').slice(1).join(' ') || 'User',
          role: 'admin',
          isActive: true,
          password: admin.password,
          createdAt: new Date(),
        };
        return next();
      }

      return res.status(401).json({ message: "Not authenticated" });
    } catch (error: any) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
  };

  const requireAdminRole = (req: any, res: any, next: any) => {
    if (!req.staff) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.staff.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    next();
  };

  // File upload endpoint
  app.post("/api/upload", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const rawType = req.body.type || 'gallery';
      const type = sanitizeUploadType(rawType);
      
      // Move file from temp to correct directory
      const tempPath = req.file.path;
      const targetDir = path.join(process.cwd(), 'attached_assets', 'uploads', type);
      
      // Security check: ensure the resolved path is within our upload directory
      const baseUploadDir = path.join(process.cwd(), 'attached_assets', 'uploads');
      const resolvedPath = path.resolve(targetDir);
      
      if (!resolvedPath.startsWith(path.resolve(baseUploadDir))) {
        // Clean up temp file
        fs.unlinkSync(tempPath);
        return res.status(400).json({ message: 'Invalid upload type' });
      }
      
      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const fileName = req.file.filename;
      const targetPath = path.join(targetDir, fileName);
      
      // Move file to correct location
      fs.renameSync(tempPath, targetPath);
      
      const fileUrl = `/attached-assets/uploads/${type}/${fileName}`;

      res.json({ 
        url: fileUrl,
        filename: fileName,
        message: "File uploaded successfully" 
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      // Clean up temp file if it exists
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "File upload failed: " + error.message });
    }
  });

  // Stripe payment intent route for competition bookings
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        message: "Payment processing is not configured. Please set up Stripe API keys." 
      });
    }

    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { competitionId, teamId } = req.body;
      
      if (!competitionId) {
        return res.status(400).json({ 
          message: "Competition ID is required" 
        });
      }

      // Get competition from database for authoritative pricing
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ 
          message: "Competition not found" 
        });
      }

      // Parse entry fee from competition (stored as string)
      const entryFee = parseFloat(competition.entryFee);
      
      if (isNaN(entryFee) || entryFee <= 0) {
        return res.status(400).json({
          message: "This competition does not require payment"
        });
      }

      const userId = req.session!.userId!;

      // If teamId provided, verify user is the team creator (primary member)
      if (teamId) {
        const team = await storage.getTeam(teamId);
        if (!team) {
          return res.status(404).json({ message: "Team not found" });
        }
        if (team.createdBy !== userId) {
          return res.status(403).json({ message: "Only the team creator can make payment for the team" });
        }
        if (team.competitionId !== competitionId) {
          return res.status(400).json({ message: "Team is not registered for this competition" });
        }
        
        // Prevent double charging: reject if team already paid
        if (team.paymentStatus === "succeeded") {
          return res.status(400).json({ message: "Team has already been paid for. Cannot create another payment." });
        }
      }

      // Check peg availability before creating payment intent
      const existingParticipants = await storage.getCompetitionParticipants(competitionId);
      const existingTeams = await storage.getTeamsByCompetition(competitionId);
      const totalBooked = existingParticipants.length + existingTeams.filter(t => t.paymentStatus === "succeeded").length;
      
      if (totalBooked >= competition.pegsTotal) {
        return res.status(400).json({ message: "Competition is full. No pegs available." });
      }
      
      // Create payment intent
      const metadata: any = {
        competitionId,
        competitionName: competition.name,
        userId: userId,
        entryFee: entryFee.toString(),
      };

      if (teamId) {
        metadata.teamId = teamId;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(entryFee * 100), // Convert to pence (GBP)
        currency: "gbp",
        metadata,
      });
      
      // Create pending payment record
      // Store amount in pence (smallest currency unit) to match Stripe's format
      const amountInPence = Math.round(entryFee * 100);
      const paymentData: any = {
        competitionId,
        userId: userId,
        amount: amountInPence.toString(),
        currency: "gbp",
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
      };

      // Add teamId if this is a team booking
      if (teamId) {
        paymentData.teamId = teamId;
      }

      await storage.createPayment(paymentData);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: entryFee,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      
      // Provide helpful error messages for common Stripe issues
      let errorMessage = "Error creating payment intent: " + error.message;
      
      if (error.message && error.message.includes('Invalid API Key')) {
        errorMessage = "Stripe API key is invalid. Please ensure STRIPE_SECRET_KEY is set correctly. " +
                      "Get your key from https://dashboard.stripe.com/apikeys (starts with sk_test_ or sk_live_)";
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  // Confirm payment and join competition atomically
  app.post("/api/confirm-payment-and-join", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { paymentIntentId, competitionId, teamId } = req.body;
      const userId = req.session!.userId!;
      
      if (!paymentIntentId || !competitionId) {
        return res.status(400).json({ 
          message: "Payment intent ID and competition ID are required" 
        });
      }

      // Get payment record
      const payment = await storage.getPaymentByIntentId(paymentIntentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Verify payment belongs to this user and competition
      if (payment.userId !== userId || payment.competitionId !== competitionId) {
        return res.status(403).json({ message: "Payment verification failed" });
      }

      // Validate teamId if provided
      if (teamId) {
        // Verify payment was created for this team
        if (payment.teamId !== teamId) {
          return res.status(400).json({ message: "Payment was not created for this team" });
        }

        const team = await storage.getTeam(teamId);
        if (!team) {
          return res.status(404).json({ message: "Team not found" });
        }
        
        // Idempotency: If team already paid and has peg, verify pegsBooked and return success
        if (team.paymentStatus === "succeeded" && team.pegNumber) {
          const competition = await storage.getCompetition(competitionId);
          if (competition) {
            // Verify pegsBooked was incremented (fix partial failures)
            const existingParticipants = await storage.getCompetitionParticipants(competitionId);
            const existingTeams = await storage.getTeamsByCompetition(competitionId);
            const paidTeamsCount = existingTeams.filter(t => t.paymentStatus === "succeeded").length;
            const expectedBooked = existingParticipants.length + paidTeamsCount;
            
            if (competition.pegsBooked < expectedBooked) {
              // Fix: increment pegsBooked if it was missed in previous attempt
              await storage.updateCompetition(competitionId, {
                pegsBooked: expectedBooked
              });
            }
          }
          
          return res.json({ 
            success: true,
            team,
            pegNumber: team.pegNumber,
            message: `Team already confirmed. Assigned to peg ${team.pegNumber}.` 
          });
        }
        
        // Verify user is team creator
        if (team.createdBy !== userId) {
          return res.status(403).json({ message: "Only team creator can confirm payment for the team" });
        }

        // Verify team belongs to this competition
        if (team.competitionId !== competitionId) {
          return res.status(400).json({ message: "Team is not registered for this competition" });
        }
      }

      // Handle team bookings
      if (teamId) {
        const team = await storage.getTeam(teamId)!;
        const competition = await storage.getCompetition(competitionId);
        
        if (!competition) {
          return res.status(404).json({ message: "Competition not found" });
        }

        // Find next available peg for the team BEFORE marking payment succeeded
        let availablePeg = 0;
        if (competition.pegsTotal > 0) {
          const existingParticipants = await storage.getCompetitionParticipants(competitionId);
          const existingTeams = await storage.getTeamsByCompetition(competitionId);
          const assignedPegs = new Set([
            ...existingParticipants.map(p => p.pegNumber),
            ...existingTeams.filter(t => t.pegNumber).map(t => t.pegNumber!)
          ]);
          
          for (let peg = 1; peg <= competition.pegsTotal; peg++) {
            if (!assignedPegs.has(peg)) {
              availablePeg = peg;
              break;
            }
          }
        }

        if (availablePeg === 0) {
          // Don't mark payment as succeeded if no pegs available
          return res.status(400).json({ message: "No available pegs for this competition. Please contact support for refund." });
        }

        // NOW mark payment as succeeded (only after confirming peg availability)
        await storage.updatePaymentStatus(payment.id, "succeeded");

        // Update team with payment success and peg assignment
        await storage.updateTeam(teamId, { 
          paymentStatus: "succeeded",
          pegNumber: availablePeg 
        });

        // Increment pegsBooked for the competition
        await storage.updateCompetition(competitionId, {
          pegsBooked: competition.pegsBooked + 1
        });

        res.json({ 
          success: true,
          team: { ...team, pegNumber: availablePeg, paymentStatus: "succeeded" },
          pegNumber: availablePeg,
          message: `Payment confirmed for team successfully. Team assigned to peg ${availablePeg}.` 
        });
      } else {
        // Verify this is not a team payment (payment.teamId should be null)
        if (payment.teamId) {
          return res.status(400).json({ message: "This payment was created for a team. Please provide teamId." });
        }

        // Individual booking - Join the competition (pegNumber will be auto-assigned)
        const participant = await storage.joinCompetition({
          competitionId,
          userId: userId,
          // pegNumber is not passed, so it will be auto-assigned
        });

        res.json({ 
          success: true,
          participant,
          message: "Payment confirmed and peg booked successfully" 
        });
      }
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ 
        message: "Error confirming payment: " + error.message 
      });
    }
  });

  // Staff/Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const result = staffLoginSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid login data",
          errors: result.error.errors 
        });
      }

      const { email, password } = result.data;
      
      // Try to find staff member
      let staff = await storage.getStaffByEmail(email);
      
      // Fallback to legacy admin for backward compatibility
      if (!staff) {
        const admin = await storage.getAdminByEmail(email);
        if (admin && admin.password === password) {
          // Convert admin to staff format
          staff = {
            id: admin.id,
            email: admin.email,
            firstName: admin.name.split(' ')[0] || 'Admin',
            lastName: admin.name.split(' ').slice(1).join(' ') || 'User',
            role: 'admin',
            isActive: true,
            password: admin.password,
            createdAt: new Date(),
          };
        }
      }
      
      if (!staff || staff.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!staff.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }

      // Store staff ID in session
      req.session.staffId = staff.id;
      req.session.adminId = staff.id; // Keep for backward compatibility
      
      // Explicitly save the session before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        
        res.json({
          id: staff.id,
          email: staff.email,
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: staff.role,
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
      const staffId = req.session?.staffId || req.session?.adminId;
      
      if (!staffId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Try to get staff member
      let staff = await storage.getStaff(staffId);
      
      // Fallback to legacy admin
      if (!staff) {
        const admin = await storage.getAdmin(staffId);
        if (admin) {
          staff = {
            id: admin.id,
            email: admin.email,
            firstName: admin.name.split(' ')[0] || 'Admin',
            lastName: admin.name.split(' ').slice(1).join(' ') || 'User',
            role: 'admin',
            isActive: true,
            password: admin.password,
            createdAt: new Date(),
          };
        }
      }
      
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      res.json({
        id: staff.id,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
      });
    } catch (error: any) {
      console.error("Get staff error:", error);
      res.status(500).json({ message: "Error fetching staff data: " + error.message });
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

  // Staff Management Routes (Admin Only)
  app.get("/api/admin/staff", requireStaffAuth, requireAdminRole, async (req, res) => {
    try {
      const staffMembers = await storage.getAllStaff();
      
      // Remove password from response
      const sanitizedStaff = staffMembers.map(s => ({
        id: s.id,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        role: s.role,
        isActive: s.isActive,
        createdAt: s.createdAt,
      }));
      
      res.json(sanitizedStaff);
    } catch (error: any) {
      console.error("Get staff error:", error);
      res.status(500).json({ message: "Error fetching staff: " + error.message });
    }
  });

  app.post("/api/admin/staff", requireStaffAuth, requireAdminRole, async (req, res) => {
    try {
      const result = insertStaffSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid staff data",
          errors: result.error.errors 
        });
      }

      // Check if email already exists
      const existingStaff = await storage.getStaffByEmail(result.data.email);
      if (existingStaff) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const newStaff = await storage.createStaff(result.data);
      
      // Remove password from response
      res.status(201).json({
        id: newStaff.id,
        email: newStaff.email,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        role: newStaff.role,
        isActive: newStaff.isActive,
        createdAt: newStaff.createdAt,
      });
    } catch (error: any) {
      console.error("Create staff error:", error);
      res.status(500).json({ message: "Error creating staff: " + error.message });
    }
  });

  app.put("/api/admin/staff/:id", requireStaffAuth, requireAdminRole, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.staff) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const result = updateStaffSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid update data",
          errors: result.error.errors 
        });
      }

      // Prevent staff from changing their own role
      if (id === req.staff.id && result.data.role && result.data.role !== req.staff.role) {
        return res.status(403).json({ message: "Cannot change your own role" });
      }

      // Check if email is being changed and already exists
      if (result.data.email) {
        const existingStaff = await storage.getStaffByEmail(result.data.email);
        if (existingStaff && existingStaff.id !== id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const updatedStaff = await storage.updateStaff(id, result.data);
      
      if (!updatedStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      // Remove password from response
      res.json({
        id: updatedStaff.id,
        email: updatedStaff.email,
        firstName: updatedStaff.firstName,
        lastName: updatedStaff.lastName,
        role: updatedStaff.role,
        isActive: updatedStaff.isActive,
        createdAt: updatedStaff.createdAt,
      });
    } catch (error: any) {
      console.error("Update staff error:", error);
      res.status(500).json({ message: "Error updating staff: " + error.message });
    }
  });

  app.post("/api/admin/staff/:id/password", requireStaffAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.staff) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only allow updating own password or if admin
      if (id !== req.staff.id && req.staff.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = updateStaffPasswordSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid password data",
          errors: result.error.errors 
        });
      }

      const staff = await storage.getStaff(id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      // Verify current password
      if (staff.password !== result.data.currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const updatedStaff = await storage.updateStaffPassword(id, result.data.newPassword);
      
      if (!updatedStaff) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Update staff password error:", error);
      res.status(500).json({ message: "Error updating password: " + error.message });
    }
  });

  app.delete("/api/admin/staff/:id", requireStaffAuth, requireAdminRole, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.staff) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Prevent staff from deleting themselves
      if (id === req.staff.id) {
        return res.status(403).json({ message: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteStaff(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      res.json({ message: "Staff member deleted successfully" });
    } catch (error: any) {
      console.error("Delete staff error:", error);
      res.status(500).json({ message: "Error deleting staff: " + error.message });
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

      // Generate verification token and send email
      const verificationToken = randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

      await storage.setEmailVerificationToken(user.id, verificationToken, tokenExpiry);
      
      try {
        await sendEmailVerification(user.email, verificationToken, user.firstName);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration even if email fails
      }

      // Do NOT auto-login - user must verify email first
      res.json({
        message: "Registration successful! Please check your email to verify your account.",
        email: user.email,
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

      // Only block if emailVerified is explicitly false (backward compatible with existing users)
      if (user.emailVerified === false) {
        return res.status(403).json({ 
          message: "Please verify your email address before logging in. Check your inbox for the verification link.",
          emailNotVerified: true
        });
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

  // Forgot Password - Send reset email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const result = forgotPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid email", 
          errors: result.error.errors 
        });
      }

      const { email } = result.data;
      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ 
          message: "If an account exists with this email, you will receive password reset instructions." 
        });
      }

      // Generate reset token (32 bytes = 64 hex characters)
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Hash the token before storing in database for security
      const hashedToken = createHash('sha256').update(resetToken).digest('hex');

      // Save hashed reset token to database
      await storage.setPasswordResetToken(email, hashedToken, resetTokenExpiry);

      // Send password reset email
      try {
        await sendPasswordResetEmail(
          email, 
          resetToken, 
          `${user.firstName} ${user.lastName}`
        );
        
        res.json({ 
          message: "If an account exists with this email, you will receive password reset instructions." 
        });
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        return res.status(500).json({ 
          message: "Failed to send password reset email. Please try again later." 
        });
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request: " + error.message });
    }
  });

  // Reset Password - Update password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const result = resetPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid reset data", 
          errors: result.error.errors 
        });
      }

      const { token, password } = result.data;

      // Hash the token to compare with database
      const hashedToken = createHash('sha256').update(token).digest('hex');

      // Find user by hashed reset token
      const user = await storage.getUserByResetToken(hashedToken);

      if (!user) {
        return res.status(400).json({ 
          message: "Invalid or expired reset token" 
        });
      }

      // Check if token has expired
      if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
        return res.status(400).json({ 
          message: "Reset token has expired. Please request a new password reset." 
        });
      }

      // Update password and clear reset token
      await storage.updateUser(user.id, { password });
      await storage.clearPasswordResetToken(user.id);

      res.json({ 
        message: "Password has been reset successfully. You can now login with your new password." 
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password: " + error.message });
    }
  });

  // Email Verification
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      await storage.verifyUserEmail(user.id);

      res.json({ 
        message: "Email verified successfully! You can now login to your account.",
        success: true
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email: " + error.message });
    }
  });

  // Resend Verification Email
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.json({ 
          message: "If an account exists with this email, a verification email will be sent." 
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

      await storage.setEmailVerificationToken(user.id, verificationToken, tokenExpiry);
      
      try {
        await sendEmailVerification(user.email, verificationToken, user.firstName);
        res.json({ 
          message: "If an account exists with this email, a verification email will be sent." 
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        return res.status(500).json({ 
          message: "Failed to send verification email. Please try again later." 
        });
      }
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to process request: " + error.message });
    }
  });

  // Contact Form
  app.post("/api/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, mobileNumber, comment } = req.body;

      if (!firstName || !lastName || !email || !mobileNumber || !comment) {
        return res.status(400).json({ message: "All fields are required" });
      }

      await sendContactEmail({ firstName, lastName, email, mobileNumber, comment });

      res.json({ 
        message: "Thank you for contacting us. We'll get back to you soon!" 
      });
    } catch (error: any) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message. Please try again later." });
    }
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

  // Get all anglers (public directory) with search, sort, and pagination
  app.get("/api/anglers", async (req, res) => {
    try {
      const validation = anglerDirectoryQuerySchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid query parameters", errors: validation.error.errors });
      }

      const query = validation.data;
      const result = await storage.listAnglers(query);
      
      // Sanitize data - remove sensitive fields
      const sanitizedData = result.data.map(user => {
        const { password, email, resetToken, resetTokenExpiry, verificationToken, verificationTokenExpiry, emailVerified, ...publicData } = user;
        return publicData;
      });

      res.json({
        data: sanitizedData,
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(result.total / query.pageSize),
      });
    } catch (error: any) {
      console.error("Get anglers error:", error);
      res.status(500).json({ message: "Error fetching anglers: " + error.message });
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

  app.get("/api/users/:username/stats", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const leaderboardEntries = await storage.getUserLeaderboardEntries(user.id);
      
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
        bestCatch: bestCatch > 0 ? `${bestCatch.toFixed(2)} lbs` : "-",
        averageWeight: averageWeight > 0 ? `${averageWeight.toFixed(2)} lbs` : "-",
        totalWeight: totalWeight > 0 ? `${totalWeight.toFixed(2)} lbs` : "-",
        totalCompetitions: leaderboardEntries.length,
      });
    } catch (error: any) {
      console.error("Get user stats by username error:", error);
      res.status(500).json({ message: "Error fetching user stats: " + error.message });
    }
  });

  app.get("/api/users/:username/participations", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const participations = await storage.getUserParticipations(user.id);
      
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
      console.error("Get user participations by username error:", error);
      res.status(500).json({ message: "Error fetching user participations: " + error.message });
    }
  });

  app.get("/api/users/:username/gallery", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const photos = await storage.getUserGalleryPhotos(user.id);
      res.json(photos);
    } catch (error: any) {
      console.error("Get user gallery by username error:", error);
      res.status(500).json({ message: "Error fetching user gallery: " + error.message });
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
        bestCatch: bestCatch > 0 ? `${bestCatch.toFixed(2)} lbs` : "-",
        averageWeight: averageWeight > 0 ? `${averageWeight.toFixed(2)} lbs` : "-",
        totalWeight: totalWeight > 0 ? `${totalWeight.toFixed(2)} lbs` : "-",
        totalCompetitions: leaderboardEntries.length,
      });
    } catch (error: any) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Error fetching stats: " + error.message });
    }
  });

  app.put("/api/user/profile", async (req, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateUserProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: result.error.errors });
      }

      const updatedUser = await storage.updateUserProfile(userId, result.data);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Error updating profile: " + error.message });
    }
  });

  app.put("/api/user/password", async (req, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateUserPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid password data", errors: result.error.errors });
      }

      // Get all users and find the current user
      const users = await storage.getAllUsers();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      if (user.password !== result.data.currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Update password
      const updatedUser = await storage.updateUserProfile(userId, { password: result.data.newPassword } as any);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Update password error:", error);
      res.status(500).json({ message: "Error updating password: " + error.message });
    }
  });

  app.get("/api/user/gallery", async (req, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const photos = await storage.getUserGalleryPhotos(userId);
      res.json(photos);
    } catch (error: any) {
      console.error("Get gallery error:", error);
      res.status(500).json({ message: "Error fetching gallery: " + error.message });
    }
  });

  app.post("/api/user/gallery", async (req, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertUserGalleryPhotoSchema.safeParse({ ...req.body, userId });
      if (!result.success) {
        return res.status(400).json({ message: "Invalid photo data", errors: result.error.errors });
      }

      const photo = await storage.createUserGalleryPhoto(result.data);
      res.status(201).json(photo);
    } catch (error: any) {
      console.error("Create gallery photo error:", error);
      res.status(500).json({ message: "Error adding photo: " + error.message });
    }
  });

  app.delete("/api/user/gallery/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const deleted = await storage.deleteUserGalleryPhoto(req.params.id, userId);
      if (!deleted) {
        return res.status(403).json({ message: "Photo not found or you don't have permission to delete it" });
      }

      res.json({ message: "Photo deleted successfully" });
    } catch (error: any) {
      console.error("Delete gallery photo error:", error);
      res.status(500).json({ message: "Error deleting photo: " + error.message });
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
        bestCatch: bestCatch > 0 ? `${bestCatch.toFixed(2)} lbs` : "-",
        avgWeight: averageWeight > 0 ? `${averageWeight.toFixed(2)} lbs` : "-",
        totalWeight: totalWeight > 0 ? `${totalWeight.toFixed(2)} lbs` : "-",
      });
    } catch (error: any) {
      console.error("Error fetching angler stats:", error);
      res.status(500).json({ message: "Error fetching angler stats: " + error.message });
    }
  });

  app.get("/api/admin/anglers/:id/participations", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.params.id;
      const participations = await storage.getUserParticipations(userId);
      const leaderboardEntries = await storage.getUserLeaderboardEntries(userId);
      
      // Get competition details for each participation
      const participationsWithDetails = await Promise.all(
        participations.map(async (participation) => {
          const competition = await storage.getCompetition(participation.competitionId);
          const leaderboardEntry = leaderboardEntries.find(
            entry => entry.competitionId === participation.competitionId
          );
          
          return {
            competitionId: participation.competitionId,
            competitionName: competition?.name || "Unknown",
            date: competition?.date || "-",
            venue: competition?.venue || "-",
            pegNumber: participation.pegNumber || "-",
            position: leaderboardEntry?.position || "-",
            weight: leaderboardEntry?.weight || "-",
          };
        })
      );

      res.json(participationsWithDetails);
    } catch (error: any) {
      console.error("Error fetching angler participations:", error);
      res.status(500).json({ message: "Error fetching angler participations: " + error.message });
    }
  });

  app.post("/api/admin/anglers", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid angler data", errors: result.error.errors });
      }

      const existingEmail = await storage.getUserByEmail(result.data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const existingUsername = await storage.getUserByUsername(result.data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(result.data);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error creating angler:", error);
      res.status(500).json({ message: "Error creating angler: " + error.message });
    }
  });

  app.put("/api/admin/anglers/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "Angler not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating angler:", error);
      res.status(500).json({ message: "Error updating angler: " + error.message });
    }
  });

  app.delete("/api/admin/anglers/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Angler not found" });
      }

      res.json({ message: "Angler deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting angler:", error);
      res.status(500).json({ message: "Error deleting angler: " + error.message });
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
      
      // Helper function to compute competition status using UK timezone
      // Competition dates/times are stored as strings without timezone info
      // We treat them as UK local time and compare against UK current time
      const getCompetitionStatus = (comp: any): string => {
        // Get current time and competition times as UTC timestamps for comparison
        const now = new Date();
        
        // Parse competition times as UTC (append Z to treat as UTC)
        const start = new Date(`${comp.date}T${comp.time}Z`);
        
        let end: Date;
        if (comp.endDate && comp.endTime) {
          end = new Date(`${comp.endDate}T${comp.endTime}Z`);
        } else if (comp.endTime) {
          end = new Date(`${comp.date}T${comp.endTime}Z`);
        } else {
          // End of day
          end = new Date(`${comp.date}T23:59:59Z`);
        }
        
        // Note: This assumes competition times are stored in UTC
        // For UK timezone handling, times should be entered by admin in UK local time
        // and we store them as UTC
        if (now < start) {
          return "upcoming";
        } else if (now >= start && now <= end) {
          return "live";
        } else {
          return "completed";
        }
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

  app.get("/api/news/featured", async (req, res) => {
    try {
      const allNews = await storage.getAllNews();
      const featuredNews = allNews.filter(item => item.featured === true);
      res.json(featuredNews);
    } catch (error: any) {
      console.error("Error fetching featured news:", error);
      res.status(500).json({ message: "Error fetching featured news: " + error.message });
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

  app.get("/api/gallery/featured", async (req, res) => {
    try {
      const allImages = await storage.getAllGalleryImages();
      const featuredImages = allImages.filter(image => image.featured === true);
      res.json(featuredImages);
    } catch (error: any) {
      console.error("Error fetching featured gallery images:", error);
      res.status(500).json({ message: "Error fetching featured gallery images: " + error.message });
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
  app.get("/api/admin/competitions", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const competitions = await storage.getAllCompetitions();
      res.json(competitions);
    } catch (error: any) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Error fetching competitions: " + error.message });
    }
  });

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

  // Competition Participant routes (returns teams for team competitions, individuals for individual competitions)
  app.get("/api/competitions/:id/participants", async (req, res) => {
    try {
      const competition = await storage.getCompetition(req.params.id);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      // For team competitions, return teams
      if (competition.competitionMode === "team") {
        const teams = await storage.getTeamsByCompetition(req.params.id);
        
        // Enrich teams with member data and payment status
        const enrichedTeams = await Promise.all(
          teams.map(async (team) => {
            const members = await storage.getTeamMembers(team.id);
            const acceptedMembers = members.filter(m => m.status === "accepted");
            const captain = await storage.getUser(team.createdBy);
            
            return {
              id: team.id,
              userId: team.id, // Use team ID as userId for compatibility with admin UI
              pegNumber: team.pegNumber,
              name: team.name,
              username: captain?.username || "",
              club: captain?.club || "",
              avatar: captain?.avatar || "",
              joinedAt: team.createdAt,
              memberCount: acceptedMembers.length,
              paymentStatus: team.paymentStatus,
              isTeam: true,
            };
          })
        );
        
        return res.json(enrichedTeams);
      }

      // For individual competitions, return participants
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
            isTeam: false,
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

      // Check if user is already in the competition
      const isAlreadyIn = await storage.isUserInCompetition(competitionId, userId);
      console.log("[DEBUG join] Already in competition?", { userId, competitionId, isAlreadyIn });
      if (isAlreadyIn) {
        return res.status(400).json({ message: "Already joined this competition" });
      }

      // Get competition to check entry fee
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      const entryFee = parseFloat(competition.entryFee);

      // For paid competitions, verify payment exists and is successful
      // This prevents users from bypassing payment by calling join API directly
      if (!isNaN(entryFee) && entryFee > 0) {
        const userPayments = await storage.getUserPayments(userId);
        const validPayment = userPayments.find(
          p => p.competitionId === competitionId && 
              p.userId === userId && 
              p.status === "succeeded"
        );

        if (!validPayment) {
          return res.status(402).json({ 
            message: "Payment required. Please complete payment to join this competition."
          });
        }
      }

      // Let storage layer handle peg assignment atomically
      // Pass optional pegNumber from request if user wants a specific peg
      const participant = await storage.joinCompetition({
        competitionId,
        userId,
        pegNumber: req.body.pegNumber || undefined,
      });
      
      console.log("[DEBUG join] Participant created:", { participantId: participant.id, userId: participant.userId, competitionId: participant.competitionId, pegNumber: participant.pegNumber });

      res.json(participant);
    } catch (error: any) {
      console.error("Error joining competition:", error);
      res.status(500).json({ message: error.message || "Error joining competition" });
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

  app.put("/api/admin/participants/:id/peg", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { pegNumber } = req.body;
      if (typeof pegNumber !== 'number' || pegNumber < 1) {
        return res.status(400).json({ message: "Invalid peg number" });
      }

      const participant = await storage.updateParticipantPeg(req.params.id, pegNumber);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }

      res.json(participant);
    } catch (error: any) {
      console.error("Error updating participant peg:", error);
      res.status(500).json({ message: "Error updating participant peg: " + error.message });
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

  // Admin participant management routes
  app.post("/api/admin/competitions/:id/participants", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { userId, pegNumber } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const competitionId = req.params.id;

      const isAlreadyIn = await storage.isUserInCompetition(competitionId, userId);
      if (isAlreadyIn) {
        return res.status(400).json({ message: "User is already in this competition" });
      }

      const participant = await storage.joinCompetition({
        competitionId,
        userId,
        pegNumber: pegNumber || undefined,
      });

      res.json(participant);
    } catch (error: any) {
      console.error("Error adding participant:", error);
      res.status(500).json({ message: error.message || "Error adding participant" });
    }
  });

  app.delete("/api/admin/participants/:id", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteParticipant(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Participant not found" });
      }

      res.json({ message: "Participant removed successfully" });
    } catch (error: any) {
      console.error("Error removing participant:", error);
      res.status(500).json({ message: "Error removing participant: " + error.message });
    }
  });

  // Team routes
  // Create a team for a competition
  app.post("/api/competitions/:id/teams", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const competitionId = req.params.id;
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Team name is required" });
      }

      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      if (competition.competitionMode !== "team") {
        return res.status(400).json({ message: "This competition does not support teams" });
      }

      // Check if user already has a team in this competition
      const userTeams = await storage.getUserTeams(userId);
      const existingTeam = userTeams.find(t => t.competitionId === competitionId);
      if (existingTeam) {
        return res.status(400).json({ message: "You already have a team in this competition" });
      }

      // Generate a unique 6-character invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const team = await storage.createTeam({
        competitionId,
        name: name.trim(),
        inviteCode,
        createdBy: userId,
        paymentStatus: "pending",
        pegNumber: null,
      });

      // Add creator as primary member
      await storage.addTeamMember({
        teamId: team.id,
        userId,
        role: "primary",
        status: "accepted",
      });

      res.json(team);
    } catch (error: any) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Error creating team: " + error.message });
    }
  });

  // Get user's team for a specific competition
  app.get("/api/competitions/:id/my-team", async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const competitionId = req.params.id;

      // Get user's teams and find the one for this competition
      const userTeams = await storage.getUserTeams(userId);
      const team = userTeams.find(t => t.competitionId === competitionId);

      if (!team) {
        return res.status(404).json({ message: "You don't have a team for this competition" });
      }

      // Get team members
      const members = await storage.getTeamMembers(team.id);
      const acceptedMembers = members.filter(m => m.status === "accepted");

      // Enrich with member details
      const enrichedMembers = await Promise.all(
        acceptedMembers.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            id: member.id,
            userId: member.userId,
            name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
            avatar: user?.avatar,
            role: member.userId === team.createdBy ? "captain" : "member",
            joinedAt: member.joinedAt,
          };
        })
      );

      res.json({
        id: team.id,
        name: team.name,
        inviteCode: team.inviteCode,
        teamName: team.name,
        createdBy: team.createdBy,
        paymentStatus: team.paymentStatus,
        pegNumber: team.pegNumber,
        members: enrichedMembers,
        isCaptain: team.createdBy === userId,
      });
    } catch (error: any) {
      console.error("Error fetching user team:", error);
      res.status(500).json({ message: "Error fetching team: " + error.message });
    }
  });

  // Get all teams for a competition
  app.get("/api/competitions/:id/teams", async (req, res) => {
    try {
      const teams = await storage.getTeamsByCompetition(req.params.id);
      
      // Enrich teams with member count
      const enrichedTeams = await Promise.all(
        teams.map(async (team) => {
          const members = await storage.getTeamMembers(team.id);
          const acceptedMembers = members.filter(m => m.status === "accepted");
          const creator = await storage.getUser(team.createdBy);
          return {
            ...team,
            memberCount: acceptedMembers.length,
            creatorName: creator ? `${creator.firstName} ${creator.lastName}` : "Unknown",
          };
        })
      );
      
      res.json(enrichedTeams);
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Error fetching teams: " + error.message });
    }
  });

  // Get team details
  app.get("/api/teams/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const members = await storage.getTeamMembers(team.id);
      
      // Verify user is a member of this team
      const isMember = members.some(m => m.userId === userId && m.status === "accepted");
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this team" });
      }
      
      // Enrich members with user data
      const enrichedMembers = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
            username: user?.username || "",
            avatar: user?.avatar || null,
          };
        })
      );

      // Only return inviteCode to the team creator
      const isPrimaryMember = team.createdBy === userId;
      const response: any = {
        id: team.id,
        competitionId: team.competitionId,
        name: team.name,
        createdBy: team.createdBy,
        paymentStatus: team.paymentStatus,
        pegNumber: team.pegNumber,
        createdAt: team.createdAt,
        members: enrichedMembers,
      };

      // Only include inviteCode for team creator
      if (isPrimaryMember) {
        response.inviteCode = team.inviteCode;
      }

      res.json(response);
    } catch (error: any) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Error fetching team: " + error.message });
    }
  });

  // Get current user's teams
  app.get("/api/user/teams", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const teams = await storage.getUserTeams(userId);
      
      // Enrich teams with competition and member data
      const enrichedTeams = await Promise.all(
        teams.map(async (team) => {
          const competition = await storage.getCompetition(team.competitionId);
          const members = await storage.getTeamMembers(team.id);
          const acceptedMembers = members.filter(m => m.status === "accepted");
          
          const response: any = {
            id: team.id,
            competitionId: team.competitionId,
            name: team.name,
            createdBy: team.createdBy,
            paymentStatus: team.paymentStatus,
            pegNumber: team.pegNumber,
            createdAt: team.createdAt,
            competitionName: competition?.name || "Unknown Competition",
            competitionDate: competition?.date || "",
            memberCount: acceptedMembers.length,
            maxMembers: competition?.maxTeamMembers || 0,
          };

          // Only include inviteCode if user is the team creator
          if (team.createdBy === userId) {
            response.inviteCode = team.inviteCode;
          }

          return response;
        })
      );
      
      res.json(enrichedTeams);
    } catch (error: any) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ message: "Error fetching user teams: " + error.message });
    }
  });

  // Join team by invite code
  app.post("/api/teams/join", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { inviteCode } = req.body;
      if (!inviteCode) {
        return res.status(400).json({ message: "Invite code is required" });
      }

      const team = await storage.getTeamByInviteCode(inviteCode.toUpperCase());
      if (!team) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      const competition = await storage.getCompetition(team.competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }

      // Check if user is already in this team
      const isInTeam = await storage.isUserInTeam(team.id, userId);
      if (isInTeam) {
        return res.status(400).json({ message: "You are already a member of this team" });
      }

      // Check if user already has a team in this competition
      const userTeams = await storage.getUserTeams(userId);
      const existingTeam = userTeams.find(t => t.competitionId === team.competitionId);
      if (existingTeam) {
        return res.status(400).json({ message: "You already have a team in this competition" });
      }

      // Check team capacity
      const currentMembers = await storage.getTeamMembers(team.id);
      const acceptedMembers = currentMembers.filter(m => m.status === "accepted");
      if (competition.maxTeamMembers && acceptedMembers.length >= competition.maxTeamMembers) {
        return res.status(400).json({ message: "Team is full" });
      }

      const member = await storage.addTeamMember({
        teamId: team.id,
        userId,
        role: "member",
        status: "accepted",
      });

      res.json({ message: "Successfully joined team", member });
    } catch (error: any) {
      console.error("Error joining team:", error);
      res.status(500).json({ message: "Error joining team: " + error.message });
    }
  });

  // Leave team
  app.delete("/api/teams/:id/leave", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const teamId = req.params.id;
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Primary member cannot leave if there are other members
      const members = await storage.getTeamMembers(teamId);
      const userMembership = members.find(m => m.userId === userId);
      
      if (!userMembership) {
        return res.status(404).json({ message: "You are not a member of this team" });
      }

      if (userMembership.role === "primary") {
        const otherMembers = members.filter(m => m.userId !== userId && m.status === "accepted");
        if (otherMembers.length > 0) {
          return res.status(400).json({ message: "Team leader cannot leave while other members are in the team. Remove all members first or transfer leadership." });
        }
        // Delete the team if primary member is the last one
        await storage.deleteTeam(teamId);
        res.json({ message: "Team deleted successfully" });
      } else {
        await storage.removeTeamMember(userMembership.id);
        res.json({ message: "Left team successfully" });
      }
    } catch (error: any) {
      console.error("Error leaving team:", error);
      res.status(500).json({ message: "Error leaving team: " + error.message });
    }
  });

  // Remove team member (primary member only)
  app.delete("/api/teams/:teamId/members/:memberId", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { teamId, memberId } = req.params;
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Only primary member can remove others
      if (team.createdBy !== userId) {
        return res.status(403).json({ message: "Only team leader can remove members" });
      }

      const success = await storage.removeTeamMember(memberId);
      if (!success) {
        return res.status(404).json({ message: "Team member not found" });
      }

      res.json({ message: "Member removed successfully" });
    } catch (error: any) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Error removing team member: " + error.message });
    }
  });

  // Admin: Update team peg number
  app.put("/api/admin/teams/:id/peg", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { pegNumber } = req.body;
      if (typeof pegNumber !== 'number' || pegNumber < 1) {
        return res.status(400).json({ message: "Invalid peg number" });
      }

      const team = await storage.updateTeamPeg(req.params.id, pegNumber);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      res.json(team);
    } catch (error: any) {
      console.error("Error updating team peg:", error);
      res.status(500).json({ message: "Error updating team peg: " + error.message });
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

  // Get all weight entries for a participant in a competition (admin only)
  app.get("/api/admin/competitions/:competitionId/participants/:userId/entries", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { competitionId, userId } = req.params;
      const entries = await storage.getParticipantLeaderboardEntries(competitionId, userId);
      
      // Calculate total weight
      const totalWeight = entries.reduce((sum, entry) => {
        const weight = parseFloat(entry.weight.toString().replace(/[^\d.-]/g, ''));
        return sum + weight;
      }, 0);

      res.json({
        entries,
        totalWeight: totalWeight.toString(),
      });
    } catch (error: any) {
      console.error("Error fetching participant entries:", error);
      res.status(500).json({ message: "Error fetching participant entries: " + error.message });
    }
  });

  // Get all weight entries for a team in a competition (admin only)
  app.get("/api/admin/competitions/:competitionId/teams/:teamId/entries", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { competitionId, teamId } = req.params;
      const entries = await storage.getTeamLeaderboardEntries(competitionId, teamId);
      
      // Calculate total weight
      const totalWeight = entries.reduce((sum, entry) => {
        const weight = parseFloat(entry.weight.toString().replace(/[^\d.-]/g, ''));
        return sum + weight;
      }, 0);

      res.json({
        entries,
        totalWeight: totalWeight.toString(),
      });
    } catch (error: any) {
      console.error("Error fetching team entries:", error);
      res.status(500).json({ message: "Error fetching team entries: " + error.message });
    }
  });

  app.get("/api/admin/competitions/:id/payments", async (req, res) => {
    try {
      const adminId = req.session?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const competitionId = req.params.id;
      const payments = await storage.getCompetitionPayments(competitionId);

      // Enrich payments with user data
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          const user = await storage.getUser(payment.userId);
          return {
            id: payment.id,
            userId: payment.userId,
            userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
            userEmail: user?.email || "",
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            createdAt: payment.createdAt,
          };
        })
      );

      res.json(enrichedPayments);
    } catch (error: any) {
      console.error("Error fetching competition payments:", error);
      res.status(500).json({ message: "Error fetching payments: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
