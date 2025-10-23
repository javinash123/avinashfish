import { type User, type InsertUser, type UpdateUserProfile, type Admin, type InsertAdmin, type UpdateAdmin, type SliderImage, type InsertSliderImage, type UpdateSliderImage, type SiteSettings, type InsertSiteSettings, type UpdateSiteSettings, type Sponsor, type InsertSponsor, type UpdateSponsor, type News, type InsertNews, type UpdateNews, type GalleryImage, type InsertGalleryImage, type UpdateGalleryImage, type Competition, type InsertCompetition, type UpdateCompetition, type CompetitionParticipant, type InsertCompetitionParticipant, type LeaderboardEntry, type InsertLeaderboardEntry, type UpdateLeaderboardEntry, type UserGalleryPhoto, type InsertUserGalleryPhoto } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User/Angler methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: string, status: string): Promise<User | undefined>;
  updateUserProfile(id: string, updates: UpdateUserProfile): Promise<User | undefined>;
  
  // User gallery methods
  getUserGalleryPhotos(userId: string): Promise<UserGalleryPhoto[]>;
  createUserGalleryPhoto(photo: InsertUserGalleryPhoto): Promise<UserGalleryPhoto>;
  deleteUserGalleryPhoto(id: string, userId: string): Promise<boolean>;
  
  // Admin methods
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: string, updates: UpdateAdmin): Promise<Admin | undefined>;
  
  // Slider images methods
  getAllSliderImages(): Promise<SliderImage[]>;
  getSliderImage(id: string): Promise<SliderImage | undefined>;
  createSliderImage(image: InsertSliderImage): Promise<SliderImage>;
  updateSliderImage(id: string, updates: UpdateSliderImage): Promise<SliderImage | undefined>;
  deleteSliderImage(id: string): Promise<boolean>;
  
  // Site settings methods
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(updates: UpdateSiteSettings): Promise<SiteSettings | undefined>;
  
  // Sponsor methods
  getAllSponsors(): Promise<Sponsor[]>;
  getSponsor(id: string): Promise<Sponsor | undefined>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;
  updateSponsor(id: string, updates: UpdateSponsor): Promise<Sponsor | undefined>;
  deleteSponsor(id: string): Promise<boolean>;
  
  // News methods
  getAllNews(): Promise<News[]>;
  getNews(id: string): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: string, updates: UpdateNews): Promise<News | undefined>;
  deleteNews(id: string): Promise<boolean>;
  
  // Gallery methods
  getAllGalleryImages(): Promise<GalleryImage[]>;
  getGalleryImage(id: string): Promise<GalleryImage | undefined>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage | undefined>;
  deleteGalleryImage(id: string): Promise<boolean>;
  
  // Competition methods
  getAllCompetitions(): Promise<Competition[]>;
  getCompetition(id: string): Promise<Competition | undefined>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetition(id: string, updates: UpdateCompetition): Promise<Competition | undefined>;
  deleteCompetition(id: string): Promise<boolean>;
  
  // Competition Participant methods
  getCompetitionParticipants(competitionId: string): Promise<CompetitionParticipant[]>;
  getUserParticipations(userId: string): Promise<CompetitionParticipant[]>;
  getAllParticipants(): Promise<CompetitionParticipant[]>;
  joinCompetition(participant: InsertCompetitionParticipant): Promise<CompetitionParticipant>;
  leaveCompetition(competitionId: string, userId: string): Promise<boolean>;
  isUserInCompetition(competitionId: string, userId: string): Promise<boolean>;
  getAvailablePegs(competitionId: string): Promise<number[]>;
  updateParticipantPeg(participantId: string, pegNumber: number): Promise<CompetitionParticipant | undefined>;
  
  // Leaderboard methods
  getLeaderboard(competitionId: string): Promise<LeaderboardEntry[]>;
  getUserLeaderboardEntries(userId: string): Promise<LeaderboardEntry[]>;
  getParticipantLeaderboardEntries(competitionId: string, userId: string): Promise<LeaderboardEntry[]>;
  createLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
  updateLeaderboardEntry(id: string, updates: UpdateLeaderboardEntry): Promise<LeaderboardEntry | undefined>;
  deleteLeaderboardEntry(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private admins: Map<string, Admin>;
  private sliderImages: Map<string, SliderImage>;
  private siteSettings: SiteSettings | undefined;
  private sponsors: Map<string, Sponsor>;
  private news: Map<string, News>;
  private galleryImages: Map<string, GalleryImage>;
  private competitions: Map<string, Competition>;
  private competitionParticipants: Map<string, CompetitionParticipant>;
  private leaderboardEntries: Map<string, LeaderboardEntry>;
  private userGalleryPhotos: Map<string, UserGalleryPhoto>;

  constructor() {
    this.users = new Map();
    this.admins = new Map();
    this.sliderImages = new Map();
    this.sponsors = new Map();
    this.news = new Map();
    this.galleryImages = new Map();
    this.competitions = new Map();
    this.competitionParticipants = new Map();
    this.leaderboardEntries = new Map();
    this.userGalleryPhotos = new Map();
    
    // Create default admin account (password: admin123)
    const defaultAdminId = randomUUID();
    this.admins.set(defaultAdminId, {
      id: defaultAdminId,
      email: "admin@pegslam.co.uk",
      password: "admin123", // In production, this should be hashed
      name: "Admin User",
    });
    
    // Create default slider image
    const defaultSliderId = randomUUID();
    this.sliderImages.set(defaultSliderId, {
      id: defaultSliderId,
      imageUrl: "https://img.freepik.com/premium-vector/amateur-fishing-competition-flat-color-vector-illustration-professional-fishermen-tournament-amateur-anglers-ambitious-fishing-enthusiasts-2d-cartoon-characters-with-cityscape-background_151150-6243.jpg",
      order: 0,
      isActive: true,
      createdAt: new Date(),
    });
    
    // Create default site settings with logo
    const defaultSettingsId = randomUUID();
    this.siteSettings = {
      id: defaultSettingsId,
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgFWYQYxuuEgQV0EQpQlZzYS1CWljLP-Wyxh8VoV_4wqgwNQB-4QTBsr7lWiwOm7JSX9Y&usqp=CAU",
      updatedAt: new Date(),
    };

    // Create sample users for demo
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
        status: "active",
        memberSince: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
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
        status: "active",
        memberSince: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
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
        status: "active",
        memberSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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
        status: "active",
        memberSince: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
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
        status: "active",
        memberSince: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));

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
        venue: "Riverside Lake",
        description: "Our flagship spring competition featuring the best anglers from across the region",
        pegsTotal: 30,
        pegsBooked: 18,
        entryFee: "45",
        prizePool: "800",
        status: "upcoming",
        type: "Championship",
        rules: ["Standard match rules apply", "Barbless hooks only", "Keep nets mandatory"],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        name: "Midweek Match",
        date: upcomingComp1Date.toISOString().split('T')[0],
        time: "07:00",
        venue: "Canal Section 5",
        description: "Relaxed midweek competition perfect for all skill levels",
        pegsTotal: 20,
        pegsBooked: 8,
        entryFee: "25",
        prizePool: "300",
        status: "upcoming",
        type: "Open Match",
        rules: ["All methods allowed", "No bloodworm or joker"],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        name: "Monthly Open",
        date: upcomingComp2Date.toISOString().split('T')[0],
        time: "06:30",
        venue: "Meadow Lakes",
        description: "Open competition with substantial prize fund",
        pegsTotal: 40,
        pegsBooked: 5,
        entryFee: "35",
        prizePool: "600",
        status: "upcoming",
        type: "Open Match",
        rules: ["Barbless hooks only", "All pegs fishable"],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    sampleCompetitions.forEach(comp => this.competitions.set(comp.id, comp));

    // Create sample participations
    const competitions = Array.from(this.competitions.values());
    const users = Array.from(this.users.values());
    
    if (competitions.length > 0 && users.length > 0) {
      // Participations for live competition (Spring Championship)
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

      todayParticipations.forEach(p => this.competitionParticipants.set(p.id, p));

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
        upcomingParticipations.forEach(p => this.competitionParticipants.set(p.id, p));
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.memberSince).getTime() - new Date(a.memberSince).getTime()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      email: insertUser.email,
      password: insertUser.password,
      username: insertUser.username,
      club: insertUser.club ?? null,
      avatar: insertUser.avatar ?? null,
      bio: insertUser.bio ?? null,
      favouriteMethod: insertUser.favouriteMethod ?? null,
      favouriteSpecies: insertUser.favouriteSpecies ?? null,
      location: insertUser.location ?? null,
      status: "active",
      memberSince: new Date(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      status,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(id: string, updates: UpdateUserProfile & { password?: string }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      bio: updates.bio !== undefined ? updates.bio : user.bio,
      club: updates.club !== undefined ? updates.club : user.club,
      location: updates.location !== undefined ? updates.location : user.location,
      favouriteMethod: updates.favouriteMethod !== undefined ? updates.favouriteMethod : user.favouriteMethod,
      favouriteSpecies: updates.favouriteSpecies !== undefined ? updates.favouriteSpecies : user.favouriteSpecies,
      avatar: updates.avatar !== undefined ? updates.avatar : user.avatar,
      password: (updates as any).password !== undefined ? (updates as any).password : user.password,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserGalleryPhotos(userId: string): Promise<UserGalleryPhoto[]> {
    return Array.from(this.userGalleryPhotos.values())
      .filter(photo => photo.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createUserGalleryPhoto(photo: InsertUserGalleryPhoto): Promise<UserGalleryPhoto> {
    const id = randomUUID();
    const newPhoto: UserGalleryPhoto = {
      id,
      userId: photo.userId,
      url: photo.url,
      caption: photo.caption ?? null,
      createdAt: new Date(),
    };
    this.userGalleryPhotos.set(id, newPhoto);
    return newPhoto;
  }

  async deleteUserGalleryPhoto(id: string, userId: string): Promise<boolean> {
    const photo = this.userGalleryPhotos.get(id);
    if (!photo || photo.userId !== userId) return false;
    return this.userGalleryPhotos.delete(id);
  }

  async getAdmin(id: string): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.email === email,
    );
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = randomUUID();
    const admin: Admin = { ...insertAdmin, id };
    this.admins.set(id, admin);
    return admin;
  }

  async updateAdmin(id: string, updates: UpdateAdmin): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;

    const updatedAdmin: Admin = {
      ...admin,
      ...(updates.email && { email: updates.email }),
      ...(updates.name && { name: updates.name }),
      ...(updates.newPassword && { password: updates.newPassword }),
    };

    this.admins.set(id, updatedAdmin);
    return updatedAdmin;
  }

  async getAllSliderImages(): Promise<SliderImage[]> {
    return Array.from(this.sliderImages.values()).sort((a, b) => a.order - b.order);
  }

  async getSliderImage(id: string): Promise<SliderImage | undefined> {
    return this.sliderImages.get(id);
  }

  async createSliderImage(insertImage: InsertSliderImage): Promise<SliderImage> {
    const id = randomUUID();
    const image: SliderImage = {
      id,
      imageUrl: insertImage.imageUrl,
      order: insertImage.order ?? 0,
      isActive: insertImage.isActive ?? true,
      createdAt: new Date(),
    };
    this.sliderImages.set(id, image);
    return image;
  }

  async updateSliderImage(id: string, updates: UpdateSliderImage): Promise<SliderImage | undefined> {
    const image = this.sliderImages.get(id);
    if (!image) return undefined;

    const updatedImage: SliderImage = {
      ...image,
      ...updates,
    };

    this.sliderImages.set(id, updatedImage);
    return updatedImage;
  }

  async deleteSliderImage(id: string): Promise<boolean> {
    return this.sliderImages.delete(id);
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    return this.siteSettings;
  }

  async updateSiteSettings(updates: UpdateSiteSettings): Promise<SiteSettings | undefined> {
    if (!this.siteSettings) return undefined;

    this.siteSettings = {
      ...this.siteSettings,
      ...updates,
      updatedAt: new Date(),
    };

    return this.siteSettings;
  }

  async getAllSponsors(): Promise<Sponsor[]> {
    return Array.from(this.sponsors.values());
  }

  async getSponsor(id: string): Promise<Sponsor | undefined> {
    return this.sponsors.get(id);
  }

  async createSponsor(insertSponsor: InsertSponsor): Promise<Sponsor> {
    const id = randomUUID();
    const sponsor: Sponsor = {
      id,
      ...insertSponsor,
      website: insertSponsor.website ?? null,
      social: insertSponsor.social as { facebook?: string; twitter?: string; instagram?: string; } | null ?? null,
      createdAt: new Date(),
    };
    this.sponsors.set(id, sponsor);
    return sponsor;
  }

  async updateSponsor(id: string, updates: UpdateSponsor): Promise<Sponsor | undefined> {
    const sponsor = this.sponsors.get(id);
    if (!sponsor) return undefined;

    const updatedSponsor: Sponsor = {
      ...sponsor,
      ...updates,
      social: (updates.social !== undefined ? updates.social : sponsor.social) as { facebook?: string; twitter?: string; instagram?: string; } | null,
    };

    this.sponsors.set(id, updatedSponsor);
    return updatedSponsor;
  }

  async deleteSponsor(id: string): Promise<boolean> {
    return this.sponsors.delete(id);
  }

  async getAllNews(): Promise<News[]> {
    return Array.from(this.news.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getNews(id: string): Promise<News | undefined> {
    return this.news.get(id);
  }

  async createNews(insertNews: InsertNews): Promise<News> {
    const id = randomUUID();
    const news: News = {
      id,
      ...insertNews,
      competition: insertNews.competition ?? null,
      createdAt: new Date(),
    };
    this.news.set(id, news);
    return news;
  }

  async updateNews(id: string, updates: UpdateNews): Promise<News | undefined> {
    const newsItem = this.news.get(id);
    if (!newsItem) return undefined;

    const updatedNews: News = {
      ...newsItem,
      ...updates,
    };

    this.news.set(id, updatedNews);
    return updatedNews;
  }

  async deleteNews(id: string): Promise<boolean> {
    return this.news.delete(id);
  }

  async getAllGalleryImages(): Promise<GalleryImage[]> {
    return Array.from(this.galleryImages.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getGalleryImage(id: string): Promise<GalleryImage | undefined> {
    return this.galleryImages.get(id);
  }

  async createGalleryImage(insertImage: InsertGalleryImage): Promise<GalleryImage> {
    const id = randomUUID();
    const image: GalleryImage = {
      id,
      ...insertImage,
      competition: insertImage.competition ?? null,
      angler: insertImage.angler ?? null,
      weight: insertImage.weight ?? null,
      createdAt: new Date(),
    };
    this.galleryImages.set(id, image);
    return image;
  }

  async updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage | undefined> {
    const image = this.galleryImages.get(id);
    if (!image) return undefined;

    const updatedImage: GalleryImage = {
      ...image,
      ...updates,
    };

    this.galleryImages.set(id, updatedImage);
    return updatedImage;
  }

  async deleteGalleryImage(id: string): Promise<boolean> {
    return this.galleryImages.delete(id);
  }

  async getAllCompetitions(): Promise<Competition[]> {
    return Array.from(this.competitions.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  async getCompetition(id: string): Promise<Competition | undefined> {
    return this.competitions.get(id);
  }

  async createCompetition(insertCompetition: InsertCompetition): Promise<Competition> {
    const id = randomUUID();
    const competition: Competition = {
      id,
      ...insertCompetition,
      status: insertCompetition.status ?? "upcoming",
      pegsBooked: insertCompetition.pegsBooked ?? 0,
      rules: insertCompetition.rules ?? null,
      createdAt: new Date(),
    };
    this.competitions.set(id, competition);
    return competition;
  }

  async updateCompetition(id: string, updates: UpdateCompetition): Promise<Competition | undefined> {
    const competition = this.competitions.get(id);
    if (!competition) return undefined;

    const updatedCompetition: Competition = {
      ...competition,
      ...updates,
    };

    this.competitions.set(id, updatedCompetition);
    return updatedCompetition;
  }

  async deleteCompetition(id: string): Promise<boolean> {
    return this.competitions.delete(id);
  }

  async getCompetitionParticipants(competitionId: string): Promise<CompetitionParticipant[]> {
    return Array.from(this.competitionParticipants.values()).filter(
      (participant) => participant.competitionId === competitionId
    );
  }

  async getUserParticipations(userId: string): Promise<CompetitionParticipant[]> {
    return Array.from(this.competitionParticipants.values()).filter(
      (participant) => participant.userId === userId
    );
  }

  async getAllParticipants(): Promise<CompetitionParticipant[]> {
    return Array.from(this.competitionParticipants.values());
  }

  async joinCompetition(insertParticipant: InsertCompetitionParticipant): Promise<CompetitionParticipant> {
    const { competitionId, userId } = insertParticipant;
    
    // Get the competition to ensure it exists
    const competition = await this.getCompetition(competitionId);
    if (!competition) {
      throw new Error("Competition not found");
    }
    
    // Atomically assign the next available peg
    // Get current participants and find the next available peg
    const participants = await this.getCompetitionParticipants(competitionId);
    const bookedPegs = new Set(participants.map(p => p.pegNumber).filter(p => p !== null));
    
    let assignedPegNumber: number | null = null;
    
    // If a specific peg was requested, validate it
    if (insertParticipant.pegNumber !== undefined && insertParticipant.pegNumber !== null) {
      if (bookedPegs.has(insertParticipant.pegNumber)) {
        throw new Error(`Peg ${insertParticipant.pegNumber} is already assigned to another angler`);
      }
      if (insertParticipant.pegNumber < 1 || insertParticipant.pegNumber > competition.pegsTotal) {
        throw new Error(`Peg ${insertParticipant.pegNumber} is not valid for this competition`);
      }
      assignedPegNumber = insertParticipant.pegNumber;
    } else {
      // Find the first available peg
      for (let i = 1; i <= competition.pegsTotal; i++) {
        if (!bookedPegs.has(i)) {
          assignedPegNumber = i;
          break;
        }
      }
      
      if (assignedPegNumber === null) {
        throw new Error("No available pegs");
      }
    }
    
    // Create the participant with the assigned peg
    const id = randomUUID();
    const participant: CompetitionParticipant = {
      id,
      competitionId,
      userId,
      pegNumber: assignedPegNumber,
      joinedAt: new Date(),
    };
    
    // Double-check the peg is still available (race condition protection)
    const currentParticipants = await this.getCompetitionParticipants(competitionId);
    const currentBookedPegs = new Set(currentParticipants.map(p => p.pegNumber).filter(p => p !== null));
    if (currentBookedPegs.has(assignedPegNumber)) {
      throw new Error(`Peg ${assignedPegNumber} was just taken by another angler. Please try again.`);
    }
    
    // Save the participant
    this.competitionParticipants.set(id, participant);
    
    // Update competition pegs booked count
    await this.updateCompetition(competition.id, {
      pegsBooked: competition.pegsBooked + 1,
    });
    
    return participant;
  }

  async leaveCompetition(competitionId: string, userId: string): Promise<boolean> {
    const participant = Array.from(this.competitionParticipants.values()).find(
      (p) => p.competitionId === competitionId && p.userId === userId
    );
    
    if (!participant) return false;
    
    const deleted = this.competitionParticipants.delete(participant.id);
    
    if (deleted) {
      // Update competition pegs booked count
      const competition = await this.getCompetition(competitionId);
      if (competition && competition.pegsBooked > 0) {
        await this.updateCompetition(competition.id, {
          pegsBooked: competition.pegsBooked - 1,
        });
      }
    }
    
    return deleted;
  }

  async isUserInCompetition(competitionId: string, userId: string): Promise<boolean> {
    return Array.from(this.competitionParticipants.values()).some(
      (p) => p.competitionId === competitionId && p.userId === userId
    );
  }

  async getAvailablePegs(competitionId: string): Promise<number[]> {
    const competition = await this.getCompetition(competitionId);
    if (!competition) return [];
    
    const participants = await this.getCompetitionParticipants(competitionId);
    const bookedPegs = new Set(participants.map(p => p.pegNumber));
    
    const availablePegs: number[] = [];
    for (let i = 1; i <= competition.pegsTotal; i++) {
      if (!bookedPegs.has(i)) {
        availablePegs.push(i);
      }
    }
    
    return availablePegs;
  }

  async updateParticipantPeg(participantId: string, pegNumber: number): Promise<CompetitionParticipant | undefined> {
    const participant = this.competitionParticipants.get(participantId);
    if (!participant) return undefined;

    // Check if this peg is already assigned to another participant in the same competition
    const existingPegAssignment = Array.from(this.competitionParticipants.values()).find(
      (p) => p.competitionId === participant.competitionId && 
             p.id !== participantId && 
             p.pegNumber === pegNumber
    );

    if (existingPegAssignment) {
      throw new Error(`Peg ${pegNumber} is already assigned to another angler`);
    }

    const updatedParticipant: CompetitionParticipant = {
      ...participant,
      pegNumber,
    };

    this.competitionParticipants.set(participantId, updatedParticipant);
    return updatedParticipant;
  }

  async getLeaderboard(competitionId: string): Promise<LeaderboardEntry[]> {
    const entries = Array.from(this.leaderboardEntries.values())
      .filter((entry) => entry.competitionId === competitionId);
    
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
    const entries = Array.from(this.leaderboardEntries.values())
      .filter((entry) => entry.userId === userId);
    
    // Sort by weight (highest first)
    return entries.sort((a, b) => {
      const weightA = parseFloat(a.weight.toString().replace(/[^\d.-]/g, ''));
      const weightB = parseFloat(b.weight.toString().replace(/[^\d.-]/g, ''));
      return weightB - weightA;
    });
  }

  async getParticipantLeaderboardEntries(competitionId: string, userId: string): Promise<LeaderboardEntry[]> {
    const entries = Array.from(this.leaderboardEntries.values())
      .filter((entry) => entry.competitionId === competitionId && entry.userId === userId);
    
    // Sort by creation time (most recent first)
    return entries.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async createLeaderboardEntry(insertEntry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const id = randomUUID();
    const entry: LeaderboardEntry = {
      id,
      ...insertEntry,
      position: insertEntry.position ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leaderboardEntries.set(id, entry);
    return entry;
  }

  async updateLeaderboardEntry(id: string, updates: UpdateLeaderboardEntry): Promise<LeaderboardEntry | undefined> {
    const entry = this.leaderboardEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry: LeaderboardEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date(),
    };

    this.leaderboardEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteLeaderboardEntry(id: string): Promise<boolean> {
    return this.leaderboardEntries.delete(id);
  }
}

import { MongoDBStorage } from "./mongodb-storage";

// Initialize storage based on environment
// If MONGODB_URI is available, use MongoDB; otherwise fall back to in-memory storage
let storage: IStorage;

if (process.env.MONGODB_URI) {
  const mongoStorage = new MongoDBStorage(process.env.MONGODB_URI);
  // Connect to MongoDB asynchronously
  mongoStorage.connect().catch(err => {
    console.error("Failed to connect to MongoDB:", err);
    console.log("Falling back to in-memory storage");
    storage = new MemStorage();
  });
  storage = mongoStorage;
} else {
  console.log("No MONGODB_URI found, using in-memory storage");
  storage = new MemStorage();
}

export { storage };
