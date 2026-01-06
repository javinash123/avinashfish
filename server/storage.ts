import { type User, type InsertUser, type UpdateUserProfile, type Admin, type InsertAdmin, type UpdateAdmin, type Staff, type InsertStaff, type UpdateStaff, type SliderImage, type InsertSliderImage, type UpdateSliderImage, type SiteSettings, type InsertSiteSettings, type UpdateSiteSettings, type Sponsor, type InsertSponsor, type UpdateSponsor, type News, type InsertNews, type UpdateNews, type GalleryImage, type InsertGalleryImage, type UpdateGalleryImage, type YoutubeVideo, type InsertYoutubeVideo, type UpdateYoutubeVideo, type Competition, type InsertCompetition, type UpdateCompetition, type CompetitionParticipant, type InsertCompetitionParticipant, type Team, type InsertTeam, type UpdateTeam, type TeamMember, type InsertTeamMember, type LeaderboardEntry, type InsertLeaderboardEntry, type UpdateLeaderboardEntry, type UserGalleryPhoto, type InsertUserGalleryPhoto, type Payment, type InsertPayment } from "@shared/schema";
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
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserStatus(id: string, status: string): Promise<User | undefined>;
  updateUserProfile(id: string, updates: UpdateUserProfile): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  setPasswordResetToken(email: string, token: string, expiry: Date): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<User | undefined>;
  setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  verifyUserEmail(userId: string): Promise<User | undefined>;
  listAnglers(query: {
    search?: string;
    sortBy?: 'name' | 'memberSince' | 'club';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ data: User[]; total: number }>;
  
  // User gallery methods
  getUserGalleryPhotos(userId: string): Promise<UserGalleryPhoto[]>;
  createUserGalleryPhoto(photo: InsertUserGalleryPhoto): Promise<UserGalleryPhoto>;
  deleteUserGalleryPhoto(id: string, userId: string): Promise<boolean>;
  
  // Admin methods (legacy)
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: string, updates: UpdateAdmin): Promise<Admin | undefined>;
  
  // Staff methods
  getAllStaff(): Promise<Staff[]>;
  getStaff(id: string): Promise<Staff | undefined>;
  getStaffByEmail(email: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, updates: UpdateStaff): Promise<Staff | undefined>;
  updateStaffPassword(id: string, newPassword: string): Promise<Staff | undefined>;
  deleteStaff(id: string): Promise<boolean>;
  
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
  
  // YouTube Video methods
  getAllYoutubeVideos(): Promise<YoutubeVideo[]>;
  getActiveYoutubeVideos(): Promise<YoutubeVideo[]>;
  getYoutubeVideo(id: string): Promise<YoutubeVideo | undefined>;
  createYoutubeVideo(video: InsertYoutubeVideo): Promise<YoutubeVideo>;
  updateYoutubeVideo(id: string, updates: UpdateYoutubeVideo): Promise<YoutubeVideo | undefined>;
  deleteYoutubeVideo(id: string): Promise<boolean>;
  
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
  deleteParticipant(participantId: string): Promise<boolean>;
  isUserInCompetition(competitionId: string, userId: string): Promise<boolean>;
  getAvailablePegs(competitionId: string): Promise<number[]>;
  updateParticipantPeg(participantId: string, pegNumber: number): Promise<CompetitionParticipant | undefined>;
  updateTeamPeg(teamId: string, pegNumber: number): Promise<Team | undefined>;
  
  // Team methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  updateTeam(id: string, updates: UpdateTeam): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;
  getTeamsByCompetition(competitionId: string): Promise<Team[]>;
  getUserTeams(userId: string): Promise<Team[]>;
  getTeamByInviteCode(inviteCode: string): Promise<Team | undefined>;
  
  // Team Member methods
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  getUserTeamMemberships(userId: string): Promise<TeamMember[]>;
  updateTeamMemberStatus(id: string, status: string): Promise<TeamMember | undefined>;
  updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined>;
  removeTeamMember(id: string): Promise<boolean>;
  isUserInTeam(teamId: string, userId: string): Promise<boolean>;
  
  // Leaderboard methods
  getLeaderboard(competitionId: string): Promise<LeaderboardEntry[]>;
  getUserLeaderboardEntries(userId: string): Promise<LeaderboardEntry[]>;
  getParticipantLeaderboardEntries(competitionId: string, userId: string): Promise<LeaderboardEntry[]>;
  getTeamLeaderboardEntries(competitionId: string, teamId: string): Promise<LeaderboardEntry[]>;
  createLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
  updateLeaderboardEntry(id: string, updates: UpdateLeaderboardEntry): Promise<LeaderboardEntry | undefined>;
  deleteLeaderboardEntry(id: string): Promise<boolean>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByIntentId(intentId: string): Promise<Payment | undefined>;
  getCompetitionPayments(competitionId: string): Promise<Payment[]>;
  getUserPayments(userId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: string): Promise<Payment | undefined>;
}

export async function initializeStorage(): Promise<IStorage> {
  return storage;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private admins: Map<string, Admin>;
  private staff: Map<string, Staff>;
  private sliderImages: Map<string, SliderImage>;
  private siteSettings: SiteSettings | undefined;
  private sponsors: Map<string, Sponsor>;
  private news: Map<string, News>;
  private galleryImages: Map<string, GalleryImage>;
  private youtubeVideos: Map<string, YoutubeVideo>;
  private competitions: Map<string, Competition>;
  private competitionParticipants: Map<string, CompetitionParticipant>;
  private teams: Map<string, Team>;
  private teamMembers: Map<string, TeamMember>;
  private leaderboardEntries: Map<string, LeaderboardEntry>;
  private userGalleryPhotos: Map<string, UserGalleryPhoto>;
  private payments: Map<string, Payment>;

  constructor() {
    this.users = new Map();
    this.admins = new Map();
    this.staff = new Map();
    this.sliderImages = new Map();
    this.sponsors = new Map();
    this.news = new Map();
    this.galleryImages = new Map();
    this.youtubeVideos = new Map();
    this.competitions = new Map();
    this.competitionParticipants = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.leaderboardEntries = new Map();
    this.userGalleryPhotos = new Map();
    this.payments = new Map();
    
    // Create default admin account (password: admin123) - Legacy support
    const defaultAdminId = randomUUID();
    this.admins.set(defaultAdminId, {
      id: defaultAdminId,
      email: "admin@pegslam.co.uk",
      password: "admin123", // In production, this should be hashed
      name: "Admin User",
    });
    
    // Create default staff admin account (password: admin123)
    const defaultStaffId = randomUUID();
    this.staff.set(defaultStaffId, {
      id: defaultStaffId,
      email: "admin@pegslam.co.uk",
      password: "admin123", // In production, this should be hashed
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
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
        youtubeUrl: null,
        youtubeVideoUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        status: "active",
        mobileNumber: null,
        dateOfBirth: null,
        resetToken: null,
        resetTokenExpiry: null,
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: true,
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
        youtubeUrl: null,
        youtubeVideoUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        status: "active",
        mobileNumber: null,
        dateOfBirth: null,
        resetToken: null,
        resetTokenExpiry: null,
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: true,
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
        youtubeUrl: null,
        youtubeVideoUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        status: "active",
        mobileNumber: null,
        dateOfBirth: null,
        resetToken: null,
        resetTokenExpiry: null,
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: true,
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
        youtubeUrl: null,
        youtubeVideoUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        status: "active",
        mobileNumber: null,
        dateOfBirth: null,
        resetToken: null,
        resetTokenExpiry: null,
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: true,
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
        youtubeUrl: null,
        youtubeVideoUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        status: "active",
        mobileNumber: null,
        dateOfBirth: null,
        resetToken: null,
        resetTokenExpiry: null,
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: true,
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
        endDate: null,
        endTime: null,
        venue: "Riverside Lake",
        description: "Our flagship spring competition featuring the best anglers from across the region",
        pegsTotal: 30,
        pegsBooked: 18,
        entryFee: "45",
        prizePool: "800",
        prizeType: "pool" as const,
        status: "upcoming",
        type: "Championship",
        rules: ["Standard match rules apply", "Barbless hooks only", "Keep nets mandatory"],
        imageUrl: null,
        thumbnailUrl: null,
        thumbnailUrlMd: null,
        thumbnailUrlLg: null,
        competitionMode: "individual" as const,
        teamPegAssignmentMode: "team",
        maxTeamMembers: null,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        name: "Midweek Match",
        date: upcomingComp1Date.toISOString().split('T')[0],
        time: "07:00",
        endDate: null,
        endTime: null,
        venue: "Canal Section 5",
        description: "Relaxed midweek competition perfect for all skill levels",
        pegsTotal: 20,
        pegsBooked: 8,
        entryFee: "25",
        prizePool: "300",
        prizeType: "pool" as const,
        status: "upcoming",
        type: "Open Match",
        rules: ["All methods allowed", "No bloodworm or joker"],
        imageUrl: null,
        thumbnailUrl: null,
        thumbnailUrlMd: null,
        thumbnailUrlLg: null,
        competitionMode: "individual" as const,
        teamPegAssignmentMode: "team",
        maxTeamMembers: null,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        name: "Monthly Open",
        date: upcomingComp2Date.toISOString().split('T')[0],
        time: "06:30",
        endDate: null,
        endTime: null,
        venue: "Meadow Lakes",
        description: "Open competition with substantial prize fund",
        pegsTotal: 40,
        pegsBooked: 5,
        entryFee: "35",
        prizePool: "600",
        prizeType: "pool" as const,
        status: "upcoming",
        type: "Open Match",
        rules: ["Barbless hooks only", "All pegs fishable"],
        imageUrl: null,
        thumbnailUrl: null,
        thumbnailUrlMd: null,
        thumbnailUrlLg: null,
        competitionMode: "individual" as const,
        teamPegAssignmentMode: "team",
        maxTeamMembers: null,
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

  async listAnglers(query: {
    search?: string;
    sortBy?: 'name' | 'memberSince' | 'club';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ data: User[]; total: number }> {
    const { search = '', sortBy = 'name', sortOrder = 'asc', page = 1, pageSize = 20 } = query;
    
    let filteredUsers = Array.from(this.users.values());
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        (user.club && user.club.toLowerCase().includes(searchLower))
      );
    }
    
    filteredUsers.sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortBy === 'name') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (sortBy === 'memberSince') {
        aVal = new Date(a.memberSince).getTime();
        bVal = new Date(b.memberSince).getTime();
      } else if (sortBy === 'club') {
        aVal = (a.club || '').toLowerCase();
        bVal = (b.club || '').toLowerCase();
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    const total = filteredUsers.length;
    const data = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
    
    return { data, total };
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = {
      id,
      ...user,
      club: user.club ?? null,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
      favouriteMethod: user.favouriteMethod ?? null,
      favouriteSpecies: user.favouriteSpecies ?? null,
      location: user.location ?? null,
      mobileNumber: user.mobileNumber ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      youtubeUrl: user.youtubeUrl ?? null,
      youtubeVideoUrl: user.youtubeVideoUrl ?? null,
      facebookUrl: user.facebookUrl ?? null,
      twitterUrl: user.twitterUrl ?? null,
      instagramUrl: user.instagramUrl ?? null,
      tiktokUrl: user.tiktokUrl ?? null,
      status: "active",
      memberSince: new Date(),
      createdAt: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
      verificationToken: null,
      verificationTokenExpiry: null,
      emailVerified: false,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, status };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(id: string, updates: UpdateUserProfile): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    const updatedUser = { ...user, resetToken: token, resetTokenExpiry: expiry };
    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token,
    );
  }

  async clearPasswordResetToken(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, resetToken: null, resetTokenExpiry: null };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, verificationToken: token, verificationTokenExpiry: expiry };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token,
    );
  }

  async verifyUserEmail(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updatedUser = { ...user, emailVerified: true, verificationToken: null, verificationTokenExpiry: null };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUserGalleryPhotos(userId: string): Promise<UserGalleryPhoto[]> {
    return Array.from(this.userGalleryPhotos.values()).filter(p => p.userId === userId);
  }

  async createUserGalleryPhoto(photo: InsertUserGalleryPhoto): Promise<UserGalleryPhoto> {
    const id = randomUUID();
    const newPhoto: UserGalleryPhoto = { id, ...photo, caption: photo.caption ?? null, createdAt: new Date() };
    this.userGalleryPhotos.set(id, newPhoto);
    return newPhoto;
  }

  async deleteUserGalleryPhoto(id: string, userId: string): Promise<boolean> {
    const photo = this.userGalleryPhotos.get(id);
    if (photo && photo.userId === userId) {
      return this.userGalleryPhotos.delete(id);
    }
    return false;
  }

  // Admin methods (legacy)
  async getAdmin(id: string): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.email === email,
    );
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = randomUUID();
    const newAdmin = { id, ...admin };
    this.admins.set(id, newAdmin);
    return newAdmin;
  }

  async updateAdmin(id: string, updates: UpdateAdmin): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;
    const updatedAdmin = { ...admin, ...updates };
    this.admins.set(id, updatedAdmin);
    return updatedAdmin;
  }

  // Staff methods
  async getAllStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async getStaffByEmail(email: string): Promise<Staff | undefined> {
    return Array.from(this.staff.values()).find(
      (s) => s.email === email,
    );
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    const id = randomUUID();
    const newStaff: Staff = { 
      id, 
      ...staff, 
      isActive: staff.isActive ?? true, 
      createdAt: new Date() 
    };
    this.staff.set(id, newStaff);
    return newStaff;
  }

  async updateStaff(id: string, updates: UpdateStaff): Promise<Staff | undefined> {
    const staff = this.staff.get(id);
    if (!staff) return undefined;
    const updatedStaff = { ...staff, ...updates };
    this.staff.set(id, updatedStaff);
    return updatedStaff;
  }

  async updateStaffPassword(id: string, newPassword: string): Promise<Staff | undefined> {
    const staff = this.staff.get(id);
    if (!staff) return undefined;
    const updatedStaff = { ...staff, password: newPassword };
    this.staff.set(id, updatedStaff);
    return updatedStaff;
  }

  async deleteStaff(id: string): Promise<boolean> {
    return this.staff.delete(id);
  }

  // Slider images methods
  async getAllSliderImages(): Promise<SliderImage[]> {
    return Array.from(this.sliderImages.values()).sort((a, b) => a.order - b.order);
  }

  async getSliderImage(id: string): Promise<SliderImage | undefined> {
    return this.sliderImages.get(id);
  }

  async createSliderImage(image: InsertSliderImage): Promise<SliderImage> {
    const id = randomUUID();
    const newImage = { id, ...image, isActive: image.isActive ?? true, order: image.order ?? 0, createdAt: new Date() };
    this.sliderImages.set(id, newImage);
    return newImage;
  }

  async updateSliderImage(id: string, updates: UpdateSliderImage): Promise<SliderImage | undefined> {
    const image = this.sliderImages.get(id);
    if (!image) return undefined;
    const updatedImage = { ...image, ...updates };
    this.sliderImages.set(id, updatedImage);
    return updatedImage;
  }

  async deleteSliderImage(id: string): Promise<boolean> {
    return this.sliderImages.delete(id);
  }

  // Site settings methods
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    return this.siteSettings;
  }

  async updateSiteSettings(updates: UpdateSiteSettings): Promise<SiteSettings | undefined> {
    if (!this.siteSettings) return undefined;
    this.siteSettings = { ...this.siteSettings, ...updates, updatedAt: new Date() };
    return this.siteSettings;
  }

  // Sponsor methods
  async getAllSponsors(): Promise<Sponsor[]> {
    return Array.from(this.sponsors.values());
  }

  async getSponsor(id: string): Promise<Sponsor | undefined> {
    return this.sponsors.get(id);
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    const id = randomUUID();
    const newSponsor: Sponsor = { 
      id, 
      ...sponsor, 
      website: sponsor.website ?? null,
      social: sponsor.social as any ?? null,
      createdAt: new Date() 
    };
    this.sponsors.set(id, newSponsor);
    return newSponsor;
  }

  async updateSponsor(id: string, updates: UpdateSponsor): Promise<Sponsor | undefined> {
    const sponsor = this.sponsors.get(id);
    if (!sponsor) return undefined;
    const updatedSponsor = { ...sponsor, ...updates };
    this.sponsors.set(id, updatedSponsor);
    return updatedSponsor;
  }

  async deleteSponsor(id: string): Promise<boolean> {
    return this.sponsors.delete(id);
  }

  // News methods
  async getAllNews(): Promise<News[]> {
    return Array.from(this.news.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getNews(id: string): Promise<News | undefined> {
    return this.news.get(id);
  }

  async createNews(news: InsertNews): Promise<News> {
    const id = randomUUID();
    const newNews: News = { id, ...news, competition: news.competition ?? null, featured: news.featured ?? false, createdAt: new Date() };
    this.news.set(id, newNews);
    return newNews;
  }

  async updateNews(id: string, updates: UpdateNews): Promise<News | undefined> {
    const news = this.news.get(id);
    if (!news) return undefined;
    const updatedNews = { ...news, ...updates };
    this.news.set(id, updatedNews);
    return updatedNews;
  }

  async deleteNews(id: string): Promise<boolean> {
    return this.news.delete(id);
  }

  // Gallery methods
  async getAllGalleryImages(): Promise<GalleryImage[]> {
    return Array.from(this.galleryImages.values());
  }

  async getGalleryImage(id: string): Promise<GalleryImage | undefined> {
    return this.galleryImages.get(id);
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const id = randomUUID();
    const newImage: GalleryImage = { 
      id, 
      ...image, 
      competition: image.competition ?? null,
      featured: image.featured ?? false,
      angler: image.angler ?? null,
      weight: image.weight ?? null,
      createdAt: new Date() 
    };
    this.galleryImages.set(id, newImage);
    return newImage;
  }

  async updateGalleryImage(id: string, updates: UpdateGalleryImage): Promise<GalleryImage | undefined> {
    const image = this.galleryImages.get(id);
    if (!image) return undefined;
    const updatedImage = { ...image, ...updates };
    this.galleryImages.set(id, updatedImage);
    return updatedImage;
  }

  async deleteGalleryImage(id: string): Promise<boolean> {
    return this.galleryImages.delete(id);
  }

  // YouTube Video methods
  async getAllYoutubeVideos(): Promise<YoutubeVideo[]> {
    return Array.from(this.youtubeVideos.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getActiveYoutubeVideos(): Promise<YoutubeVideo[]> {
    return Array.from(this.youtubeVideos.values())
      .filter(v => v.active)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getYoutubeVideo(id: string): Promise<YoutubeVideo | undefined> {
    return this.youtubeVideos.get(id);
  }

  async createYoutubeVideo(video: InsertYoutubeVideo): Promise<YoutubeVideo> {
    const id = randomUUID();
    const newVideo: YoutubeVideo = { id, ...video, active: video.active ?? true, description: video.description ?? null, displayOrder: video.displayOrder ?? 0, createdAt: new Date() };
    this.youtubeVideos.set(id, newVideo);
    return newVideo;
  }

  async updateYoutubeVideo(id: string, updates: UpdateYoutubeVideo): Promise<YoutubeVideo | undefined> {
    const video = this.youtubeVideos.get(id);
    if (!video) return undefined;
    const updatedVideo = { ...video, ...updates };
    this.youtubeVideos.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteYoutubeVideo(id: string): Promise<boolean> {
    return this.youtubeVideos.delete(id);
  }

  // Competition methods
  async getAllCompetitions(): Promise<Competition[]> {
    return Array.from(this.competitions.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  async getCompetition(id: string): Promise<Competition | undefined> {
    return this.competitions.get(id);
  }

  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const id = randomUUID();
    const newCompetition: Competition = { 
      id, 
      ...competition, 
      pegsBooked: 0, 
      status: "upcoming",
      imageUrl: competition.imageUrl ?? null,
      thumbnailUrl: competition.thumbnailUrl ?? null,
      thumbnailUrlMd: competition.thumbnailUrlMd ?? null,
      thumbnailUrlLg: competition.thumbnailUrlLg ?? null,
      endDate: competition.endDate ?? null,
      endTime: competition.endTime ?? null,
      createdAt: new Date() 
    };
    this.competitions.set(id, newCompetition);
    return newCompetition;
  }

  async updateCompetition(id: string, updates: UpdateCompetition): Promise<Competition | undefined> {
    const competition = this.competitions.get(id);
    if (!competition) return undefined;
    const updatedCompetition = { ...competition, ...updates };
    this.competitions.set(id, updatedCompetition);
    return updatedCompetition;
  }

  async deleteCompetition(id: string): Promise<boolean> {
    return this.competitions.delete(id);
  }

  // Competition Participant methods
  async getCompetitionParticipants(competitionId: string): Promise<CompetitionParticipant[]> {
    return Array.from(this.competitionParticipants.values()).filter(p => p.competitionId === competitionId);
  }

  async getUserParticipations(userId: string): Promise<CompetitionParticipant[]> {
    return Array.from(this.competitionParticipants.values()).filter(p => p.userId === userId);
  }

  async getAllParticipants(): Promise<CompetitionParticipant[]> {
    return Array.from(this.competitionParticipants.values());
  }

  async joinCompetition(participant: InsertCompetitionParticipant): Promise<CompetitionParticipant> {
    const id = randomUUID();
    const newParticipant: CompetitionParticipant = { id, ...participant, pegNumber: participant.pegNumber ?? null, joinedAt: new Date() };
    this.competitionParticipants.set(id, newParticipant);
    return newParticipant;
  }

  async leaveCompetition(competitionId: string, userId: string): Promise<boolean> {
    const participant = Array.from(this.competitionParticipants.values()).find(
      p => p.competitionId === competitionId && p.userId === userId
    );
    if (participant) {
      return this.competitionParticipants.delete(participant.id);
    }
    return false;
  }

  async deleteParticipant(participantId: string): Promise<boolean> {
    return this.competitionParticipants.delete(participantId);
  }

  async isUserInCompetition(competitionId: string, userId: string): Promise<boolean> {
    return Array.from(this.competitionParticipants.values()).some(
      p => p.competitionId === competitionId && p.userId === userId
    );
  }

  async getAvailablePegs(competitionId: string): Promise<number[]> {
    const competition = this.competitions.get(competitionId);
    if (!competition) return [];
    
    const participants = await this.getCompetitionParticipants(competitionId);
    const bookedPegs = new Set(participants.map(p => p.pegNumber).filter((p): p is number => p !== null));
    
    const availablePegs = [];
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
    const updatedParticipant = { ...participant, pegNumber };
    this.competitionParticipants.set(participantId, updatedParticipant);
    return updatedParticipant;
  }

  async updateTeamPeg(teamId: string, pegNumber: number): Promise<Team | undefined> {
    const team = this.teams.get(teamId);
    if (!team) return undefined;
    const updatedTeam = { ...team, pegNumber };
    this.teams.set(teamId, updatedTeam);
    return updatedTeam;
  }

  // Team methods
  async createTeam(team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const newTeam: Team = { 
      id, 
      ...team, 
      image: team.image ?? null,
      paymentStatus: team.paymentStatus ?? "pending",
      pegNumber: team.pegNumber ?? null,
      createdAt: new Date() 
    };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async updateTeam(id: string, updates: UpdateTeam): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }

  async getTeamsByCompetition(competitionId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(t => t.competitionId === competitionId);
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(t => t.createdBy === userId);
  }

  async getTeamByInviteCode(inviteCode: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(t => t.inviteCode === inviteCode);
  }

  // Team Member methods
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = randomUUID();
    const newMember: TeamMember = { id, ...member, status: member.status ?? "pending", joinedAt: new Date() };
    this.teamMembers.set(id, newMember);
    return newMember;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(m => m.teamId === teamId);
  }

  async getUserTeamMemberships(userId: string): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(m => m.userId === userId);
  }

  async updateTeamMemberStatus(id: string, status: string): Promise<TeamMember | undefined> {
    const member = this.teamMembers.get(id);
    if (!member) return undefined;
    const updatedMember = { ...member, status };
    this.teamMembers.set(id, updatedMember);
    return updatedMember;
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const member = this.teamMembers.get(id);
    if (!member) return undefined;
    const updatedMember = { ...member, ...updates };
    this.teamMembers.set(id, updatedMember);
    return updatedMember;
  }

  async removeTeamMember(id: string): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    return Array.from(this.teamMembers.values()).some(
      m => m.teamId === teamId && m.userId === userId && m.status === "accepted"
    );
  }

  // Leaderboard methods
  async getLeaderboard(competitionId: string): Promise<LeaderboardEntry[]> {
    return Array.from(this.leaderboardEntries.values()).filter(e => e.competitionId === competitionId);
  }

  async getUserLeaderboardEntries(userId: string): Promise<LeaderboardEntry[]> {
    return Array.from(this.leaderboardEntries.values()).filter(e => e.userId === userId);
  }

  async getParticipantLeaderboardEntries(competitionId: string, userId: string): Promise<LeaderboardEntry[]> {
    return Array.from(this.leaderboardEntries.values()).filter(
      e => e.competitionId === competitionId && e.userId === userId
    );
  }

  async getTeamLeaderboardEntries(competitionId: string, teamId: string): Promise<LeaderboardEntry[]> {
    return Array.from(this.leaderboardEntries.values()).filter(
      e => e.competitionId === competitionId && e.teamId === teamId
    );
  }

  async createLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const id = randomUUID();
    const newEntry: LeaderboardEntry = { 
      id, 
      ...entry, 
      userId: entry.userId ?? null,
      teamId: entry.teamId ?? null,
      position: entry.position ?? null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.leaderboardEntries.set(id, newEntry);
    return newEntry;
  }

  async updateLeaderboardEntry(id: string, updates: UpdateLeaderboardEntry): Promise<LeaderboardEntry | undefined> {
    const entry = this.leaderboardEntries.get(id);
    if (!entry) return undefined;
    const updatedEntry = { ...entry, ...updates, updatedAt: new Date() };
    this.leaderboardEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteLeaderboardEntry(id: string): Promise<boolean> {
    return this.leaderboardEntries.delete(id);
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const newPayment: Payment = { id, ...payment, teamId: payment.teamId ?? null, currency: payment.currency ?? "GBP", createdAt: new Date() };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByIntentId(intentId: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(p => p.stripePaymentIntentId === intentId);
  }

  async getCompetitionPayments(competitionId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.competitionId === competitionId);
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.userId === userId);
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    const updatedPayment = { ...payment, status };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
}

export const storage = new MemStorage();
