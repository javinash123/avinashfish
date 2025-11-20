import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { type User, type InsertUser, type UpdateUserProfile, type UserGalleryPhoto, type InsertUserGalleryPhoto, type Admin, type InsertAdmin, type UpdateAdmin, type SliderImage, type InsertSliderImage, type UpdateSliderImage, type SiteSettings, type InsertSiteSettings, type UpdateSiteSettings, type Sponsor, type InsertSponsor, type UpdateSponsor, type News, type InsertNews, type UpdateNews, type GalleryImage, type InsertGalleryImage, type UpdateGalleryImage, type Competition, type InsertCompetition, type UpdateCompetition, type CompetitionParticipant, type InsertCompetitionParticipant, type Team, type InsertTeam, type UpdateTeam, type TeamMember, type InsertTeamMember, type LeaderboardEntry, type InsertLeaderboardEntry, type UpdateLeaderboardEntry, type Payment, type InsertPayment } from "@shared/schema";
import { randomUUID } from "crypto";
import { IStorage } from "./storage";

export class MongoDBStorage implements IStorage {
  private client: MongoClient;
  private db!: Db;
  private users!: Collection<User>;
  private admins!: Collection<Admin>;
  private sliderImages!: Collection<SliderImage>;
  private siteSettings!: Collection<SiteSettings>;
  private sponsors!: Collection<Sponsor>;
  private news!: Collection<News>;
  private galleryImages!: Collection<GalleryImage>;
  private competitions!: Collection<Competition>;
  private competitionParticipants!: Collection<CompetitionParticipant>;
  private teams!: Collection<Team>;
  private teamMembers!: Collection<TeamMember>;
  private leaderboardEntries!: Collection<LeaderboardEntry>;
  private userGalleryPhotos!: Collection<UserGalleryPhoto>;
  private payments!: Collection<Payment>;

  constructor(uri: string) {
    this.client = new MongoClient(uri);
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db("peg_slam");
      
      // Initialize collections
      this.users = this.db.collection<User>("users");
      this.admins = this.db.collection<Admin>("admins");
      this.sliderImages = this.db.collection<SliderImage>("slider_images");
      this.siteSettings = this.db.collection<SiteSettings>("site_settings");
      this.sponsors = this.db.collection<Sponsor>("sponsors");
      this.news = this.db.collection<News>("news");
      this.galleryImages = this.db.collection<GalleryImage>("gallery_images");
      this.competitions = this.db.collection<Competition>("competitions");
      this.competitionParticipants = this.db.collection<CompetitionParticipant>("competition_participants");
      this.teams = this.db.collection<Team>("teams");
      this.teamMembers = this.db.collection<TeamMember>("team_members");
      this.leaderboardEntries = this.db.collection<LeaderboardEntry>("leaderboard_entries");
      this.userGalleryPhotos = this.db.collection<UserGalleryPhoto>("user_gallery_photos");
      this.payments = this.db.collection<Payment>("payments");

      // Create indexes
      await this.createIndexes();
      
      // Initialize with default data if empty
      await this.initializeDefaultData();
      
      console.log("✅ Connected to MongoDB Atlas successfully");
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      throw error;
    }
  }

  private async createIndexes() {
    // Create unique indexes for email and username
    await this.users.createIndex({ email: 1 }, { unique: true });
    await this.users.createIndex({ username: 1 }, { unique: true });
    await this.admins.createIndex({ email: 1 }, { unique: true });
    await this.competitionParticipants.createIndex({ competitionId: 1, userId: 1 }, { unique: true });
    
    // Create sparse unique compound index to prevent duplicate peg assignments per competition
    // Sparse index only enforces uniqueness for non-null pegNumber values
    await this.competitionParticipants.createIndex(
      { competitionId: 1, pegNumber: 1 }, 
      { unique: true, sparse: true }
    );
    
    // Create indexes for angler directory search and sorting performance
    await this.users.createIndex({ firstName: 1 });
    await this.users.createIndex({ lastName: 1 });
    await this.users.createIndex({ club: 1 });
    await this.users.createIndex({ memberSince: -1 });
    
    // Create team indexes
    await this.teams.createIndex({ competitionId: 1 });
    await this.teams.createIndex({ createdBy: 1 });
    await this.teams.createIndex({ inviteCode: 1 }, { unique: true });
    await this.teamMembers.createIndex({ teamId: 1 });
    await this.teamMembers.createIndex({ userId: 1 });
    await this.teamMembers.createIndex({ teamId: 1, userId: 1 }, { unique: true });
  }

  private async initializeDefaultData() {
    // Check if admin exists
    const adminCount = await this.admins.countDocuments();
    if (adminCount === 0) {
      // SECURITY: Only create default admin in development mode
      // In production, admin accounts must be created manually with secure passwords
      if (process.env.NODE_ENV !== 'production') {
        const defaultAdminId = randomUUID();
        await this.admins.insertOne({
          id: defaultAdminId,
          email: "admin@pegslam.co.uk",
          password: "admin123",
          name: "Admin User",
        });
        console.log("✅ Default admin created (development only)");
      } else {
        console.log("⚠️  No admin accounts found. Create an admin account manually in production.");
      }
    }

    // Check if site settings exist
    const settingsCount = await this.siteSettings.countDocuments();
    if (settingsCount === 0) {
      const defaultSettingsId = randomUUID();
      await this.siteSettings.insertOne({
        id: defaultSettingsId,
        logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgFWYQYxuuEgQV0EQpQlZzYS1CWljLP-Wyxh8VoV_4wqgwNQB-4QTBsr7lWiwOm7JSX9Y&usqp=CAU",
        updatedAt: new Date(),
      });
      console.log("✅ Default site settings created");
    }

    // Check if slider images exist
    const sliderCount = await this.sliderImages.countDocuments();
    if (sliderCount === 0) {
      const defaultSliderId = randomUUID();
      await this.sliderImages.insertOne({
        id: defaultSliderId,
        imageUrl: "https://img.freepik.com/premium-vector/amateur-fishing-competition-flat-color-vector-illustration-professional-fishermen-tournament-amateur-anglers-ambitious-fishing-enthusiasts-2d-cartoon-characters-with-cityscape-background_151150-6243.jpg",
        order: 0,
        isActive: true,
        createdAt: new Date(),
      });
      console.log("✅ Default slider image created");
    }

    // Check if users exist (create sample users in development only)
    const userCount = await this.users.countDocuments();
    if (userCount === 0 && process.env.NODE_ENV !== 'production') {
      const sampleUsers = [
        {
          id: randomUUID(),
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@example.com",
          password: "password123",
          username: "jsmith",
          club: "Thames Anglers",
          avatar: null,
          bio: "Passionate carp angler with 10 years experience",
          favouriteMethod: "Float fishing",
          favouriteSpecies: "Carp",
          location: "London",
          youtubeUrl: null,
          facebookUrl: null,
          twitterUrl: null,
          instagramUrl: null,
          tiktokUrl: null,
          status: "active",
          memberSince: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          resetToken: null,
          resetTokenExpiry: null,
          emailVerified: false,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
        {
          id: randomUUID(),
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.j@example.com",
          password: "password123",
          username: "sjohnson",
          club: "River Masters",
          avatar: null,
          bio: "Competition angler specializing in match fishing",
          favouriteMethod: "Feeder fishing",
          favouriteSpecies: "Bream",
          location: "Birmingham",
          youtubeUrl: null,
          facebookUrl: null,
          twitterUrl: null,
          instagramUrl: null,
          tiktokUrl: null,
          status: "active",
          memberSince: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          resetToken: null,
          resetTokenExpiry: null,
          emailVerified: false,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
        {
          id: randomUUID(),
          firstName: "Mike",
          lastName: "Williams",
          email: "mike.w@example.com",
          password: "password123",
          username: "mwilliams",
          club: "Lakeside Club",
          avatar: null,
          bio: "Pike fishing enthusiast",
          favouriteMethod: "Lure fishing",
          favouriteSpecies: "Pike",
          location: "Manchester",
          youtubeUrl: null,
          facebookUrl: null,
          twitterUrl: null,
          instagramUrl: null,
          tiktokUrl: null,
          status: "active",
          memberSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          resetToken: null,
          resetTokenExpiry: null,
          emailVerified: false,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
        {
          id: randomUUID(),
          firstName: "Emma",
          lastName: "Brown",
          email: "emma.b@example.com",
          password: "password123",
          username: "ebrown",
          club: null,
          avatar: null,
          bio: "New to competitive fishing",
          favouriteMethod: "Pole fishing",
          favouriteSpecies: "Roach",
          location: "Leeds",
          youtubeUrl: null,
          facebookUrl: null,
          twitterUrl: null,
          instagramUrl: null,
          tiktokUrl: null,
          status: "active",
          memberSince: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          resetToken: null,
          resetTokenExpiry: null,
          emailVerified: false,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
        {
          id: randomUUID(),
          firstName: "David",
          lastName: "Taylor",
          email: "david.t@example.com",
          password: "password123",
          username: "dtaylor",
          club: "Peg Masters",
          avatar: null,
          bio: "Experienced match angler",
          favouriteMethod: "Waggler",
          favouriteSpecies: "Tench",
          location: "Bristol",
          youtubeUrl: null,
          facebookUrl: null,
          twitterUrl: null,
          instagramUrl: null,
          tiktokUrl: null,
          status: "active",
          memberSince: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          resetToken: null,
          resetTokenExpiry: null,
          emailVerified: false,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      ];
      await this.users.insertMany(sampleUsers);
      console.log("✅ Sample users created (development only)");

      // SECURITY: Only create sample competitions in development
      if (process.env.NODE_ENV === 'production') {
        console.log("⚠️  Production mode: No sample data created. Add your own users and competitions.");
        return;
      }

      // Create sample competitions
      const now = new Date();
      const liveCompDate = new Date(now);
      liveCompDate.setHours(8, 0, 0, 0);
      
      const upcomingComp1Date = new Date(now);
      upcomingComp1Date.setDate(upcomingComp1Date.getDate() + 7);
      upcomingComp1Date.setHours(7, 0, 0, 0);

      const upcomingComp2Date = new Date(now);
      upcomingComp2Date.setDate(upcomingComp2Date.getDate() + 14);
      upcomingComp2Date.setHours(6, 30, 0, 0);

      const sampleCompetitions = [
        {
          id: randomUUID(),
          name: "Spring Championship 2025",
          date: liveCompDate.toISOString().split('T')[0],
          time: "08:00",
          endDate: null,
          endTime: "16:00",
          venue: "Riverside Lake",
          description: "Our flagship spring competition featuring the best anglers from across the region",
          pegsTotal: 30,
          pegsBooked: 18,
          entryFee: "45",
          prizePool: "800",
          prizeType: "pool",
          status: "upcoming",
          type: "Championship",
          rules: ["Standard match rules apply", "Barbless hooks only", "Keep nets mandatory"],
          imageUrl: null,
          competitionMode: "individual",
          maxTeamMembers: null,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        {
          id: randomUUID(),
          name: "Midweek Match",
          date: upcomingComp1Date.toISOString().split('T')[0],
          time: "07:00",
          endDate: null,
          endTime: "15:00",
          venue: "Canal Section 5",
          description: "Relaxed midweek competition perfect for all skill levels",
          pegsTotal: 20,
          pegsBooked: 8,
          entryFee: "25",
          prizePool: "300",
          prizeType: "pool",
          status: "upcoming",
          type: "Open Match",
          rules: ["All methods allowed", "No bloodworm or joker"],
          imageUrl: null,
          competitionMode: "individual",
          maxTeamMembers: null,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          id: randomUUID(),
          name: "Monthly Open",
          date: upcomingComp2Date.toISOString().split('T')[0],
          time: "06:30",
          endDate: null,
          endTime: "14:30",
          venue: "Meadow Lakes",
          description: "Open competition with substantial prize fund",
          pegsTotal: 40,
          pegsBooked: 5,
          entryFee: "35",
          prizePool: "600",
          prizeType: "pool",
          status: "upcoming",
          type: "Open Match",
          rules: ["Barbless hooks only", "All pegs fishable"],
          imageUrl: null,
          competitionMode: "individual",
          maxTeamMembers: null,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ];
      await this.competitions.insertMany(sampleCompetitions);
      console.log("✅ Sample competitions created");

      // Create sample participations for the live competition
      const competitions = await this.competitions.find({}).toArray();
      const users = await this.users.find({}).toArray();
      
      if (competitions.length > 0 && users.length > 0) {
        const liveComp = competitions[0];
        const todayParticipations = [
          {
            id: randomUUID(),
            competitionId: liveComp.id,
            userId: users[0].id,
            pegNumber: 5,
            joinedAt: new Date(),
          },
          {
            id: randomUUID(),
            competitionId: liveComp.id,
            userId: users[1].id,
            pegNumber: 12,
            joinedAt: new Date(),
          },
          {
            id: randomUUID(),
            competitionId: liveComp.id,
            userId: users[2].id,
            pegNumber: 8,
            joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: randomUUID(),
            competitionId: liveComp.id,
            userId: users[3].id,
            pegNumber: 15,
            joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: randomUUID(),
            competitionId: liveComp.id,
            userId: users[4].id,
            pegNumber: 3,
            joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ];
        await this.competitionParticipants.insertMany(todayParticipations);

        // Participations for upcoming competitions
        if (competitions.length > 1) {
          const upcomingComp = competitions[1];
          const upcomingParticipations = [
            {
              id: randomUUID(),
              competitionId: upcomingComp.id,
              userId: users[0].id,
              pegNumber: 3,
              joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
            {
              id: randomUUID(),
              competitionId: upcomingComp.id,
              userId: users[2].id,
              pegNumber: 7,
              joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
          ];
          await this.competitionParticipants.insertMany(upcomingParticipations);
        }
        console.log("✅ Sample participations created");
      }
    }
  }

  async disconnect() {
    await this.client.close();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const user = await this.users.findOne({ id });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.users.findOne({ email });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.users.findOne({ username });
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.users.find({}).toArray();
  }

  async listAnglers(query: {
    search?: string;
    sortBy?: 'name' | 'memberSince' | 'club';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ data: User[]; total: number }> {
    const { search = '', sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 20 } = query;
    
    // Build MongoDB aggregation pipeline
    const pipeline: any[] = [];
    
    // Stage 1: Add fullName field for proper sorting
    pipeline.push({
      $addFields: {
        fullName: { $concat: ['$firstName', ' ', '$lastName'] }
      }
    });
    
    // Stage 2: Apply search filter if provided
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      pipeline.push({
        $match: {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { username: searchRegex },
            { club: searchRegex },
            { fullName: searchRegex }
          ]
        }
      });
    }
    
    // Stage 3: Sort based on criteria (default to name if invalid sortBy)
    const sortField = sortBy === 'memberSince' ? 'memberSince' 
                    : sortBy === 'club' ? 'club' 
                    : 'fullName';  // Default fallback to name
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    
    pipeline.push({
      $sort: { [sortField]: sortDirection }
    });
    
    // Get total count with same filters
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.users.aggregate(countPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    // Stage 4: Apply pagination
    const skip = (page - 1) * pageSize;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });
    
    // Stage 5: Remove internal MongoDB _id field and temporary fullName
    pipeline.push({
      $project: {
        _id: 0,
        fullName: 0
      }
    });
    
    // Execute aggregation
    const data = await this.users.aggregate(pipeline).toArray() as User[];
    
    return { data, total };
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      ...user,
      club: user.club ?? null,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
      favouriteMethod: user.favouriteMethod ?? null,
      favouriteSpecies: user.favouriteSpecies ?? null,
      location: user.location ?? null,
      youtubeUrl: user.youtubeUrl ?? null,
      facebookUrl: user.facebookUrl ?? null,
      twitterUrl: user.twitterUrl ?? null,
      instagramUrl: user.instagramUrl ?? null,
      tiktokUrl: user.tiktokUrl ?? null,
      status: "active",
      memberSince: new Date(),
      createdAt: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
      emailVerified: false,
      verificationToken: null,
      verificationTokenExpiry: null,
    };
    await this.users.insertOne(newUser);
    return newUser;
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async updateUserProfile(id: string, updates: UpdateUserProfile): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.users.findOne({ id });
    if (!user) return false;

    await this.competitionParticipants.deleteMany({ userId: id });
    await this.leaderboardEntries.deleteMany({ userId: id });
    await this.userGalleryPhotos.deleteMany({ userId: id });
    
    const result = await this.users.deleteOne({ id });
    return result.deletedCount === 1;
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { email },
      { $set: { resetToken: token, resetTokenExpiry: expiry } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const user = await this.users.findOne({ resetToken: token });
    if (!user || !user.resetTokenExpiry) return undefined;
    
    if (user.resetTokenExpiry < new Date()) {
      return undefined;
    }
    
    return user;
  }

  async clearPasswordResetToken(userId: string): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id: userId },
      { $set: { resetToken: null, resetTokenExpiry: null } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id: userId },
      { $set: { verificationToken: token, verificationTokenExpiry: expiry, emailVerified: false } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const user = await this.users.findOne({ verificationToken: token });
    if (!user || !user.verificationTokenExpiry) return undefined;
    
    if (user.verificationTokenExpiry < new Date()) {
      return undefined;
    }
    
    return user;
  }

  async verifyUserEmail(userId: string): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id: userId },
      { $set: { emailVerified: true, verificationToken: null, verificationTokenExpiry: null } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  // User gallery methods
  async getUserGalleryPhotos(userId: string): Promise<UserGalleryPhoto[]> {
    return await this.userGalleryPhotos.find({ userId }).toArray();
  }

  async createUserGalleryPhoto(photo: InsertUserGalleryPhoto): Promise<UserGalleryPhoto> {
    const newPhoto: UserGalleryPhoto = {
      id: randomUUID(),
      ...photo,
      caption: photo.caption ?? null,
      createdAt: new Date(),
    };
    await this.userGalleryPhotos.insertOne(newPhoto);
    return newPhoto;
  }

  async deleteUserGalleryPhoto(id: string, userId: string): Promise<boolean> {
    const result = await this.userGalleryPhotos.deleteOne({ id, userId });
    return result.deletedCount === 1;
  }

  // Admin methods
  async getAdmin(id: string): Promise<Admin | undefined> {
    const admin = await this.admins.findOne({ id });
    return admin || undefined;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const admin = await this.admins.findOne({ email });
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const newAdmin: Admin = {
      id: randomUUID(),
      ...admin,
    };
    await this.admins.insertOne(newAdmin);
    return newAdmin;
  }

  async updateAdmin(id: string, updates: UpdateAdmin): Promise<Admin | undefined> {
    const result = await this.admins.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  // Staff methods
  async getAllStaff(): Promise<any[]> {
    return await this.db.collection("staff").find({}).toArray();
  }

  async getStaff(id: string): Promise<any | undefined> {
    const staff = await this.db.collection("staff").findOne({ id });
    return staff || undefined;
  }

  async getStaffByEmail(email: string): Promise<any | undefined> {
    const staff = await this.db.collection("staff").findOne({ email });
    return staff || undefined;
  }

  async createStaff(staff: any): Promise<any> {
    const newStaff = {
      id: randomUUID(),
      ...staff,
      role: staff.role ?? 'manager',
      isActive: staff.isActive ?? true,
      createdAt: new Date(),
    };
    await this.db.collection("staff").insertOne(newStaff);
    return newStaff;
  }

  async updateStaff(id: string, updates: any): Promise<any | undefined> {
    const result = await this.db.collection("staff").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async updateStaffPassword(id: string, newPassword: string): Promise<any | undefined> {
    const result = await this.db.collection("staff").findOneAndUpdate(
      { id },
      { $set: { password: newPassword } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteStaff(id: string): Promise<boolean> {
    const result = await this.db.collection("staff").deleteOne({ id });
    return result.deletedCount === 1;
  }

  // Slider images methods
  async getAllSliderImages(): Promise<SliderImage[]> {
    return await this.sliderImages.find({}).sort({ order: 1 }).toArray();
  }

  async getSliderImage(id: string): Promise<SliderImage | undefined> {
    const image = await this.sliderImages.findOne({ id });
    return image || undefined;
  }

  async createSliderImage(image: InsertSliderImage): Promise<SliderImage> {
    const newImage: SliderImage = {
      id: randomUUID(),
      ...image,
      order: image.order ?? 0,
      isActive: image.isActive ?? true,
      createdAt: new Date(),
    };
    await this.sliderImages.insertOne(newImage);
    return newImage;
  }

  async updateSliderImage(id: string, updates: UpdateSliderImage): Promise<SliderImage | undefined> {
    const result = await this.sliderImages.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteSliderImage(id: string): Promise<boolean> {
    const result = await this.sliderImages.deleteOne({ id });
    return result.deletedCount === 1;
  }

  // Site settings methods
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const settings = await this.siteSettings.findOne({});
    return settings || undefined;
  }

  async updateSiteSettings(updates: UpdateSiteSettings): Promise<SiteSettings | undefined> {
    const result = await this.siteSettings.findOneAndUpdate(
      {},
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  // Sponsor methods
  async getAllSponsors(): Promise<Sponsor[]> {
    return await this.sponsors.find({}).toArray();
  }

  async getSponsor(id: string): Promise<Sponsor | undefined> {
    const sponsor = await this.sponsors.findOne({ id });
    return sponsor || undefined;
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    const newSponsor: Sponsor = {
      id: randomUUID(),
      ...sponsor,
      website: sponsor.website ?? null,
      social: sponsor.social ? {
        facebook: sponsor.social.facebook as string | undefined,
        twitter: sponsor.social.twitter as string | undefined,
        instagram: sponsor.social.instagram as string | undefined,
      } : null,
      createdAt: new Date(),
    };
    await this.sponsors.insertOne(newSponsor);
    return newSponsor;
  }

  async updateSponsor(id: string, updates: UpdateSponsor): Promise<Sponsor | undefined> {
    const updateData: any = { ...updates };
    if (updates.social) {
      updateData.social = {
        facebook: updates.social.facebook as string | undefined,
        twitter: updates.social.twitter as string | undefined,
        instagram: updates.social.instagram as string | undefined,
      } as { facebook?: string; twitter?: string; instagram?: string };
    }
    const result = await this.sponsors.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteSponsor(id: string): Promise<boolean> {
    const result = await this.sponsors.deleteOne({ id });
    return result.deletedCount === 1;
  }

  // News methods
  async getAllNews(): Promise<News[]> {
    return await this.news.find({}).sort({ publishDate: -1 }).toArray();
  }

  async getNews(id: string): Promise<News | undefined> {
    const newsItem = await this.news.findOne({ id });
    return newsItem || undefined;
  }

  async createNews(news: InsertNews): Promise<News> {
    const newNews: News = {
      id: randomUUID(),
      ...news,
      competition: news.competition ?? null,
      featured: news.featured ?? false,
      createdAt: new Date(),
    };
    await this.news.insertOne(newNews);
    return newNews;
  }

  async updateNews(id: string, updates: UpdateNews): Promise<News | undefined> {
    const result = await this.news.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteNews(id: string): Promise<boolean> {
    const result = await this.news.deleteOne({ id });
    return result.deletedCount === 1;
  }

  // Gallery methods
  async getAllGalleryImages(): Promise<GalleryImage[]> {
    return await this.galleryImages.find({}).sort({ uploadDate: -1 }).toArray();
  }

  async getGalleryImage(id: string): Promise<GalleryImage | undefined> {
    const image = await this.galleryImages.findOne({ id });
    return image || undefined;
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const newImage: GalleryImage = {
      id: randomUUID(),
      ...image,
      competition: image.competition ?? null,
      angler: image.angler ?? null,
      weight: image.weight ?? null,
      featured: image.featured ?? false,
      createdAt: new Date(),
    };
    await this.galleryImages.insertOne(newImage);
    return newImage;
  }

  async updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage | undefined> {
    const result = await this.galleryImages.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteGalleryImage(id: string): Promise<boolean> {
    const result = await this.galleryImages.deleteOne({ id });
    return result.deletedCount === 1;
  }

  // Competition methods
  async getAllCompetitions(): Promise<Competition[]> {
    return await this.competitions.find({}).sort({ date: 1 }).toArray();
  }

  async getCompetition(id: string): Promise<Competition | undefined> {
    const competition = await this.competitions.findOne({ id });
    return competition || undefined;
  }

  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const newCompetition: Competition = {
      id: randomUUID(),
      ...competition,
      status: competition.status ?? "upcoming",
      pegsBooked: competition.pegsBooked ?? 0,
      rules: competition.rules ?? null,
      endDate: competition.endDate ?? null,
      endTime: competition.endTime ?? null,
      imageUrl: competition.imageUrl ?? null,
      prizeType: competition.prizeType ?? "pool",
      competitionMode: competition.competitionMode ?? "individual",
      maxTeamMembers: competition.maxTeamMembers ?? null,
      createdAt: new Date(),
    };
    await this.competitions.insertOne(newCompetition);
    return newCompetition;
  }

  async updateCompetition(id: string, updates: UpdateCompetition): Promise<Competition | undefined> {
    const result = await this.competitions.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteCompetition(id: string): Promise<boolean> {
    const result = await this.competitions.deleteOne({ id });
    return result.deletedCount === 1;
  }

  // Competition Participant methods
  async getCompetitionParticipants(competitionId: string): Promise<CompetitionParticipant[]> {
    return await this.competitionParticipants.find({ competitionId }).toArray();
  }

  async getUserParticipations(userId: string): Promise<CompetitionParticipant[]> {
    return await this.competitionParticipants.find({ userId }).toArray();
  }

  async getAllParticipants(): Promise<CompetitionParticipant[]> {
    return await this.competitionParticipants.find({}).toArray();
  }

  async joinCompetition(insertParticipant: InsertCompetitionParticipant): Promise<CompetitionParticipant> {
    const { competitionId, userId } = insertParticipant;
    
    // Get the competition to ensure it exists
    const competition = await this.getCompetition(competitionId);
    if (!competition) {
      throw new Error("Competition not found");
    }
    
    // If a specific peg was requested, validate and try to assign it
    if (insertParticipant.pegNumber !== undefined && insertParticipant.pegNumber !== null) {
      if (insertParticipant.pegNumber < 1 || insertParticipant.pegNumber > competition.pegsTotal) {
        throw new Error(`Peg ${insertParticipant.pegNumber} is not valid for this competition`);
      }
      
      const newParticipant: CompetitionParticipant = {
        id: randomUUID(),
        competitionId,
        userId,
        pegNumber: insertParticipant.pegNumber,
        joinedAt: new Date(),
      };
      
      try {
        await this.competitionParticipants.insertOne(newParticipant);
        await this.competitions.updateOne(
          { id: competitionId },
          { $inc: { pegsBooked: 1 } }
        );
        return newParticipant;
      } catch (error: any) {
        if (error.code === 11000) {
          throw new Error(`Peg ${insertParticipant.pegNumber} is already assigned to another angler`);
        }
        throw error;
      }
    }
    
    // For automatic assignment, use an optimistic loop with MongoDB's unique index
    // to handle concurrent joins gracefully
    let attempts = 0;
    const maxTotalAttempts = competition.pegsTotal; // Try all pegs if necessary
    
    while (attempts < maxTotalAttempts) {
      attempts++;
      
      // Get currently booked pegs
      const participants = await this.getCompetitionParticipants(competitionId);
      const bookedPegs = new Set(participants.map(p => p.pegNumber).filter(p => p !== null));
      
      // Check if competition is full
      if (bookedPegs.size >= competition.pegsTotal) {
        throw new Error("No available pegs - competition is full");
      }
      
      // Find all available pegs
      const availablePegs: number[] = [];
      for (let i = 1; i <= competition.pegsTotal; i++) {
        if (!bookedPegs.has(i)) {
          availablePegs.push(i);
        }
      }
      
      if (availablePegs.length === 0) {
        throw new Error("No available pegs - competition is full");
      }
      
      // Pick a random available peg to reduce contention
      const randomIndex = Math.floor(Math.random() * availablePegs.length);
      const pegToTry = availablePegs[randomIndex];
      
      const newParticipant: CompetitionParticipant = {
        id: randomUUID(),
        competitionId,
        userId,
        pegNumber: pegToTry,
        joinedAt: new Date(),
      };
      
      try {
        // Try to insert - MongoDB's unique index will prevent duplicates
        await this.competitionParticipants.insertOne(newParticipant);
        
        // Success! Update the pegs booked count
        await this.competitions.updateOne(
          { id: competitionId },
          { $inc: { pegsBooked: 1 } }
        );
        
        return newParticipant;
      } catch (error: any) {
        // Duplicate key error means this peg was just taken by another request
        // Loop again to try a different peg
        if (error.code === 11000) {
          // On the last attempt, give up and return a helpful error
          if (attempts >= maxTotalAttempts) {
            throw new Error("Unable to reserve a peg due to high demand. Please try again in a moment.");
          }
          // Otherwise, continue to next attempt
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }
    
    // Should not reach here, but just in case
    throw new Error("Unable to assign a peg after multiple attempts. Please try again.");
  }

  async leaveCompetition(competitionId: string, userId: string): Promise<boolean> {
    const result = await this.competitionParticipants.deleteOne({ competitionId, userId });
    return result.deletedCount === 1;
  }

  async deleteParticipant(participantId: string): Promise<boolean> {
    const result = await this.competitionParticipants.deleteOne({ id: participantId });
    return result.deletedCount === 1;
  }

  async isUserInCompetition(competitionId: string, userId: string): Promise<boolean> {
    const count = await this.competitionParticipants.countDocuments({ competitionId, userId });
    return count > 0;
  }

  async getAvailablePegs(competitionId: string): Promise<number[]> {
    const competition = await this.getCompetition(competitionId);
    if (!competition) return [];

    const participants = await this.getCompetitionParticipants(competitionId);
    const bookedPegs = participants.map(p => p.pegNumber).filter(p => p !== null) as number[];
    
    const allPegs = Array.from({ length: competition.pegsTotal }, (_, i) => i + 1);
    return allPegs.filter(peg => !bookedPegs.includes(peg));
  }

  async updateParticipantPeg(participantId: string, pegNumber: number): Promise<CompetitionParticipant | undefined> {
    try {
      // Update the peg number atomically
      // The unique compound index on {competitionId, pegNumber} will prevent duplicate assignments
      const result = await this.competitionParticipants.findOneAndUpdate(
        { id: participantId },
        { $set: { pegNumber } },
        { returnDocument: "after" }
      );
      return result || undefined;
    } catch (error: any) {
      // MongoDB duplicate key error code is 11000
      if (error.code === 11000) {
        throw new Error(`Peg ${pegNumber} is already assigned to another angler`);
      }
      throw error;
    }
  }

  // Leaderboard methods
  async getLeaderboard(competitionId: string): Promise<LeaderboardEntry[]> {
    const entries = await this.leaderboardEntries
      .find({ competitionId })
      .toArray();
    
    // Group entries by userId and aggregate total weight
    const participantMap = new Map<string, { 
      entries: LeaderboardEntry[], 
      totalWeight: number,
      pegNumber: number 
    }>();
    
    entries.forEach((entry) => {
      const weight = parseFloat(entry.weight.toString().replace(/[^\d.-]/g, ''));
      
      if (participantMap.has(entry.userId)) {
        const participant = participantMap.get(entry.userId)!;
        participant.entries.push(entry);
        participant.totalWeight += weight;
      } else {
        participantMap.set(entry.userId, {
          entries: [entry],
          totalWeight: weight,
          pegNumber: entry.pegNumber,
        });
      }
    });
    
    // Create aggregated entries with total weight
    const aggregatedEntries: LeaderboardEntry[] = Array.from(participantMap.entries()).map(([userId, data]) => {
      // Use the most recent entry as the base
      const latestEntry = data.entries[data.entries.length - 1];
      return {
        ...latestEntry,
        weight: data.totalWeight.toString(), // Store total weight
      };
    });
    
    // Sort by total weight (highest first) to calculate positions
    const sortedEntries = aggregatedEntries.sort((a, b) => {
      const weightA = parseFloat(a.weight.toString().replace(/[^\d.-]/g, ''));
      const weightB = parseFloat(b.weight.toString().replace(/[^\d.-]/g, ''));
      return weightB - weightA; // Descending order (highest weight first)
    });
    
    // Assign positions based on sorted order
    return sortedEntries.map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));
  }

  async getUserLeaderboardEntries(userId: string): Promise<LeaderboardEntry[]> {
    return await this.leaderboardEntries.find({ userId }).toArray();
  }

  async getParticipantLeaderboardEntries(competitionId: string, userId: string): Promise<LeaderboardEntry[]> {
    const entries = await this.leaderboardEntries
      .find({ competitionId, userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Normalize MongoDB documents to plain JavaScript objects
    return entries.map(entry => ({
      id: entry.id,
      competitionId: entry.competitionId,
      userId: entry.userId,
      teamId: entry.teamId ?? null,
      pegNumber: entry.pegNumber,
      weight: entry.weight.toString(),
      position: entry.position ?? null,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
    }));
  }

  async getTeamLeaderboardEntries(competitionId: string, teamId: string): Promise<LeaderboardEntry[]> {
    const entries = await this.leaderboardEntries
      .find({ competitionId, teamId })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Normalize MongoDB documents to plain JavaScript objects
    return entries.map(entry => ({
      id: entry.id,
      competitionId: entry.competitionId,
      userId: entry.userId,
      teamId: entry.teamId ?? null,
      pegNumber: entry.pegNumber,
      weight: entry.weight.toString(),
      position: entry.position ?? null,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
    }));
  }

  async createLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const newEntry: LeaderboardEntry = {
      id: randomUUID(),
      ...entry,
      teamId: entry.teamId ?? null,
      position: entry.position ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.leaderboardEntries.insertOne(newEntry);
    return newEntry;
  }

  async updateLeaderboardEntry(id: string, updates: UpdateLeaderboardEntry): Promise<LeaderboardEntry | undefined> {
    const result = await this.leaderboardEntries.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteLeaderboardEntry(id: string): Promise<boolean> {
    const result = await this.leaderboardEntries.deleteOne({ id });
    return result.deletedCount === 1;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const payment: Payment = {
      id: randomUUID(),
      ...insertPayment,
      teamId: insertPayment.teamId ?? null,
      currency: insertPayment.currency || "gbp",
      createdAt: new Date(),
    };
    await this.payments.insertOne(payment);
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const payment = await this.payments.findOne({ id });
    return payment || undefined;
  }

  async getPaymentByIntentId(intentId: string): Promise<Payment | undefined> {
    const payment = await this.payments.findOne({ stripePaymentIntentId: intentId });
    return payment || undefined;
  }

  async getCompetitionPayments(competitionId: string): Promise<Payment[]> {
    return await this.payments
      .find({ competitionId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await this.payments
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment | undefined> {
    const result = await this.payments.findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  // Team methods
  async createTeam(team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const newTeam: Team = {
      id,
      ...team,
      pegNumber: team.pegNumber ?? null,
      paymentStatus: team.paymentStatus ?? "pending",
      createdAt: new Date(),
    };
    await this.teams.insertOne(newTeam as any);
    return newTeam;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const team = await this.teams.findOne({ id });
    return team || undefined;
  }

  async updateTeam(id: string, updates: UpdateTeam): Promise<Team | undefined> {
    const result = await this.teams.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const result = await this.teams.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getTeamsByCompetition(competitionId: string): Promise<Team[]> {
    return await this.teams.find({ competitionId }).toArray();
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return await this.teams.find({ createdBy: userId }).toArray();
  }

  async getTeamByInviteCode(inviteCode: string): Promise<Team | undefined> {
    const team = await this.teams.findOne({ inviteCode });
    return team || undefined;
  }

  async updateTeamPeg(teamId: string, pegNumber: number): Promise<Team | undefined> {
    const team = await this.teams.findOne({ id: teamId });
    if (!team) return undefined;

    // Check if this peg is already assigned to another team in the same competition
    const existingTeamPegAssignment = await this.teams.findOne({
      competitionId: team.competitionId,
      id: { $ne: teamId },
      pegNumber,
    });

    if (existingTeamPegAssignment) {
      throw new Error('Peg is already assigned to another team');
    }

    // Check if this peg is already assigned to an individual participant in the same competition
    const existingParticipantPegAssignment = await this.competitionParticipants.findOne({
      competitionId: team.competitionId,
      pegNumber,
    });

    if (existingParticipantPegAssignment) {
      throw new Error('Peg is already assigned to a participant');
    }

    await this.teams.updateOne(
      { id: teamId },
      { $set: { pegNumber } }
    );

    const updatedTeam = await this.teams.findOne({ id: teamId });
    return updatedTeam || undefined;
  }

  // Team Member methods
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = randomUUID();
    const newMember: TeamMember = {
      id,
      ...member,
      status: member.status ?? "pending",
      joinedAt: new Date(),
    };
    await this.teamMembers.insertOne(newMember as any);
    return newMember;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await this.teamMembers.find({ teamId }).toArray();
  }

  async getUserTeamMemberships(userId: string): Promise<TeamMember[]> {
    return await this.teamMembers.find({ userId }).toArray();
  }

  async updateTeamMemberStatus(id: string, status: string): Promise<TeamMember | undefined> {
    const result = await this.teamMembers.findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async removeTeamMember(id: string): Promise<boolean> {
    const result = await this.teamMembers.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    const member = await this.teamMembers.findOne({ teamId, userId, status: "accepted" });
    return !!member;
  }
}
