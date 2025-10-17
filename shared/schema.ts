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
  status: text("status").notNull().default("active"),
  memberSince: timestamp("member_since").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;

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
  description: text("description").notNull(),
  social: json("social").$type<{ facebook?: string; twitter?: string; instagram?: string; }>(),
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
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  competition: text("competition"),
  date: text("date").notNull(),
  angler: text("angler"),
  weight: text("weight"),
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

export const competitions = pgTable("competitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  endTime: text("end_time"),
  venue: text("venue").notNull(),
  pegsTotal: integer("pegs_total").notNull(),
  pegsBooked: integer("pegs_booked").notNull().default(0),
  entryFee: text("entry_fee").notNull(),
  prizePool: text("prize_pool").notNull(),
  status: text("status").notNull().default("upcoming"),
  description: text("description").notNull(),
  type: text("type").notNull(),
  rules: text("rules").array(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
});

export const updateCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type UpdateCompetition = z.infer<typeof updateCompetitionSchema>;
export type Competition = typeof competitions.$inferSelect;

export const competitionParticipants = pgTable("competition_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull(),
  userId: varchar("user_id").notNull(),
  pegNumber: integer("peg_number").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertCompetitionParticipantSchema = createInsertSchema(competitionParticipants).omit({
  id: true,
  joinedAt: true,
});

export type InsertCompetitionParticipant = z.infer<typeof insertCompetitionParticipantSchema>;
export type CompetitionParticipant = typeof competitionParticipants.$inferSelect;

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitionId: varchar("competition_id").notNull(),
  userId: varchar("user_id").notNull(),
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
