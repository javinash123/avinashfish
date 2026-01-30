import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull().unique(),
  club: text("club"),
  avatar: text("avatar"),
  bio: text("bio"),
  favouriteMethod: text("favourite_method"),
  favouriteSpecies: text("favourite_species"),
  location: text("location"),
  mobileNumber: text("mobile_number"),
  dateOfBirth: text("date_of_birth"),
  youtubeUrl: text("youtube_url"),
  youtubeVideoUrl: text("youtube_video_url"),
  facebookUrl: text("facebook_url"),
  twitterUrl: text("twitter_url"),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  status: text("status").notNull().default("active"),
  memberSince: timestamp("member_since").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  status: true,
  memberSince: true,
  createdAt: true,
});

export const registerUserSchema = insertUserSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  password: true,
  club: true,
}).extend({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type User = typeof users.$inferSelect;

// Sanitized user/angler for public listing (no sensitive fields)
export const anglerListingSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  club: z.string().nullable(),
  avatar: z.string().nullable(),
  location: z.string().nullable(),
  favouriteMethod: z.string().nullable(),
  favouriteSpecies: z.string().nullable(),
  memberSince: z.date(),
});

export type AnglerListing = z.infer<typeof anglerListingSchema>;

// Angler directory query params
export const anglerDirectoryQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'memberSince', 'club']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type AnglerDirectoryQuery = z.infer<typeof anglerDirectoryQuerySchema>;

// Staff roles enum
export const staffRoles = ['admin', 'manager', 'marshal'] as const;
export type StaffRole = typeof staffRoles[number];

export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().$type<StaffRole>().default('manager'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(['admin', 'manager', 'marshal']),
});

export const updateStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  password: true,
}).extend({
  role: z.enum(['admin', 'manager', 'marshal']).optional(),
}).partial();

export const updateStaffPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type UpdateStaff = z.infer<typeof updateStaffSchema>;
export type UpdateStaffPassword = z.infer<typeof updateStaffPasswordSchema>;
export type StaffLogin = z.infer<typeof staffLoginSchema>;
export type Staff = typeof staff.$inferSelect;

// Legacy admins table - keeping for backward compatibility during migration
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  email: true,
  password: true,
  name: true,
});

export const updateAdminSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type UpdateAdmin = z.infer<typeof updateAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export const sliderImages = pgTable("slider_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSliderImageSchema = createInsertSchema(sliderImages).omit({
  id: true,
  createdAt: true,
});

export const updateSliderImageSchema = createInsertSchema(sliderImages).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertSliderImage = z.infer<typeof insertSliderImageSchema>;
export type UpdateSliderImage = z.infer<typeof updateSliderImageSchema>;
export type SliderImage = typeof sliderImages.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logoUrl: text("logo_url").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export const updateSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
}).partial();

export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;

export const sponsors = pgTable("sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tier: text("tier").notNull(),
  logo: text("logo").notNull(),
  website: text("website"),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  social: json("social").$type<{ facebook?: string; twitter?: string; instagram?: string; }>(),
  featuredAboveFooter: boolean("featured_above_footer").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
});

export const updateSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type UpdateSponsor = z.infer<typeof updateSponsorSchema>;
export type Sponsor = typeof sponsors.$inferSelect;

export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  date: text("date").notNull(),
  readTime: text("read_time").notNull(),
  image: text("image").notNull(),
  competition: text("competition"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true,
});

export const updateNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertNews = z.infer<typeof insertNewsSchema>;
export type UpdateNews = z.infer<typeof updateNewsSchema>;
export type News = typeof news.$inferSelect;

export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  urls: text("urls").array().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  competition: text("competition"),
  date: text("date").notNull(),
  angler: text("angler"),
  weight: text("weight"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
});

export const updateGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type UpdateGalleryImage = z.infer<typeof updateGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

export const youtubeVideos = pgTable("youtube_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  videoId: text("video_id").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertYoutubeVideoSchema = createInsertSchema(youtubeVideos).omit({
  id: true,
  createdAt: true,
});

export const updateYoutubeVideoSchema = createInsertSchema(youtubeVideos).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertYoutubeVideo = z.infer<typeof insertYoutubeVideoSchema>;
export type UpdateYoutubeVideo = z.infer<typeof updateYoutubeVideoSchema>;
export type YoutubeVideo = typeof youtubeVideos.$inferSelect;

export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: text("date").notNull(),
  endDate: text("end_date"),
  time: text("time").notNull(),
  endTime: text("end_time"),
  venue: text("venue").notNull(),
  pegsTotal: integer("pegs_total").notNull(),
  pegsBooked: integer("pegs_booked").notNull().default(0),
  entryFee: text("entry_fee").notNull(),
  prizePool: text("prize_pool").notNull(),
  prizeType: text("prize_type").notNull().default("pool"),
  status: text("status").notNull().default("upcoming"),
  description: text("description").notNull(),
  type: text("type").notNull(),
  rules: text("rules").array(),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailUrlMd: text("thumbnail_url_md"),
  thumbnailUrlLg: text("thumbnail_url_lg"),
  competitionMode: text("competition_mode").notNull().default("individual"),
  maxTeamMembers: integer("max_team_members"),
  teamPegAssignmentMode: text("team_peg_assignment_mode").notNull().default("team"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
  pegsBooked: true,
  status: true,
}).extend({
  prizeType: z.enum(['pool', 'other']).default('pool'),
  competitionMode: z.enum(['individual', 'team']).default('individual'),
  maxTeamMembers: z.number().int().positive().optional(),
  teamPegAssignmentMode: z.enum(['team', 'members']).default('team'),
  imageUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  thumbnailUrlMd: z.string().optional().nullable(),
  thumbnailUrlLg: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If team mode, maxTeamMembers must be provided and >= 2
    if (data.competitionMode === 'team') {
      return data.maxTeamMembers !== undefined && data.maxTeamMembers >= 2;
    }
    return true;
  },
  {
    message: "Team competitions must have a maximum team size of at least 2 members",
    path: ["maxTeamMembers"],
  }
);

export const updateCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
}).extend({
  competitionMode: z.enum(['individual', 'team']).optional(),
  maxTeamMembers: z.number().int().positive().nullish(),
  teamPegAssignmentMode: z.enum(['team', 'members']).optional(),
  imageUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  thumbnailUrlMd: z.string().optional().nullable(),
  thumbnailUrlLg: z.string().optional().nullable(),
}).partial();

export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type UpdateCompetition = z.infer<typeof updateCompetitionSchema>;
export type Competition = typeof competitions.$inferSelect;

export const competitionParticipants = pgTable("competition_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull(),
  userId: varchar("user_id").notNull(),
  pegNumber: integer("peg_number"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertCompetitionParticipantSchema = createInsertSchema(competitionParticipants).omit({
  id: true,
  joinedAt: true,
});

export type InsertCompetitionParticipant = z.infer<typeof insertCompetitionParticipantSchema>;
export type CompetitionParticipant = typeof competitionParticipants.$inferSelect;

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull(),
  name: text("name").notNull(),
  image: text("image"),
  inviteCode: text("invite_code").notNull(),
  createdBy: varchar("created_by").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  pegNumber: integer("peg_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const updateTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
}).extend({
  image: z.string().optional().nullable(),
}).partial();

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type UpdateTeam = z.infer<typeof updateTeamSchema>;
export type Team = typeof teams.$inferSelect;

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("pending"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull(),
  userId: varchar("user_id").notNull(),
  teamId: varchar("team_id"),
  amount: text("amount").notNull(),
  currency: text("currency").notNull().default("gbp"),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull(),
  userId: varchar("user_id"),
  teamId: varchar("team_id"),
  pegNumber: integer("peg_number").notNull(),
  weight: text("weight").notNull(),
  position: integer("position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({
  id: true,
  competitionId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;
export type UpdateLeaderboardEntry = z.infer<typeof updateLeaderboardEntrySchema>;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;

export const userGalleryPhotos = pgTable("user_gallery_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserGalleryPhotoSchema = createInsertSchema(userGalleryPhotos).omit({
  id: true,
  createdAt: true,
});

export const updateUserGalleryPhotoSchema = createInsertSchema(userGalleryPhotos).omit({
  id: true,
  userId: true,
  createdAt: true,
}).partial();

export type InsertUserGalleryPhoto = z.infer<typeof insertUserGalleryPhotoSchema>;
export type UpdateUserGalleryPhoto = z.infer<typeof updateUserGalleryPhotoSchema>;
export type UserGalleryPhoto = typeof userGalleryPhotos.$inferSelect;

export const updateUserProfileSchema = z.object({
  bio: z.string().optional(),
  club: z.string().optional(),
  location: z.string().optional(),
  favouriteMethod: z.string().optional(),
  favouriteSpecies: z.string().optional(),
  avatar: z.string().optional(),
  mobileNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  youtubeUrl: z.string().optional(),
  youtubeVideoUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
}).refine(data => Object.values(data).some(val => val !== undefined), {
  message: "At least one field must be provided",
});

export const updateUserPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateUserUsernameSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

export const updateUserEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserPassword = z.infer<typeof updateUserPasswordSchema>;
export type UpdateUserUsername = z.infer<typeof updateUserUsernameSchema>;
export type UpdateUserEmail = z.infer<typeof updateUserEmailSchema>;
