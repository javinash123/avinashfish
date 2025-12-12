import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { StatCard } from "@/components/stat-card";
import { CompetitionCard } from "@/components/competition-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Trophy,
  Calendar,
  Coins,
  Plus,
  Settings,
  BarChart3,
  Newspaper,
  Image as ImageIcon,
  UserCircle,
  LogOut,
  Images,
  Youtube,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminCompetitions from "./admin-competitions";
import AdminAnglers from "./admin-anglers";
import AdminSponsors from "./admin-sponsors";
import AdminSettings from "./admin-settings";
import AdminNews from "./admin-news";
import AdminGallery from "./admin-gallery";
import AdminYoutubeVideos from "./admin-youtube-videos";
import AdminProfile from "./admin-profile";
import AdminSlider from "./admin-slider";
import AdminStaff from "./admin-staff";
import AdminTeams from "./admin-teams";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCompetitionStatus } from "@/lib/uk-timezone";
import { ShieldCheck, UsersRound } from "lucide-react";

type AdminSection = "dashboard" | "competitions" | "teams" | "anglers" | "sponsors" | "news" | "gallery" | "youtube-videos" | "settings" | "profile" | "slider" | "staff";

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: "admin" | "manager" | "marshal";
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check authentication first to get role
  const { data: admin, isLoading: isCheckingAuth } = useQuery<AdminUser>({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  // Set default section based on role - marshal only sees competitions
  const [hasSetInitialSection, setHasSetInitialSection] = useState(false);
  if (admin?.role === "marshal" && !hasSetInitialSection && activeSection === "dashboard") {
    setActiveSection("competitions");
    setHasSetInitialSection(true);
  }

  // Fetch dashboard data
  const { data: dashboardStats } = useQuery<{
    totalAnglers: number;
    activeCompetitions: number;
    totalRevenue: string;
    bookingsToday: number;
  }>({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: !!admin,
  });

  const { data: allCompetitions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/competitions"],
    enabled: !!admin,
  });

  const { data: recentParticipations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/recent-participations"],
    enabled: !!admin,
  });

  useEffect(() => {
    if (!isCheckingAuth && !admin) {
      setLocation("/admin/login");
    }
  }, [admin, isCheckingAuth, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      setLocation("/admin/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  // Marshal role only sees competitions for view-only access
  const menuItems = admin?.role === "marshal" 
    ? [
        { id: "competitions" as const, title: "Competitions", icon: Trophy },
      ]
    : [
        { id: "dashboard" as const, title: "Dashboard", icon: BarChart3 },
        { id: "competitions" as const, title: "Competitions", icon: Trophy },
        { id: "teams" as const, title: "Teams", icon: UsersRound },
        { id: "anglers" as const, title: "Anglers", icon: Users },
        { id: "sponsors" as const, title: "Sponsors", icon: Coins },
        { id: "news" as const, title: "News", icon: Newspaper },
        { id: "gallery" as const, title: "Gallery", icon: ImageIcon },
        { id: "youtube-videos" as const, title: "YouTube Videos", icon: Youtube },
        { id: "slider" as const, title: "Slider & Logo", icon: Images },
        // Show staff management only to admins
        ...(admin?.role === "admin" ? [{ id: "staff" as const, title: "Staff", icon: ShieldCheck }] : []),
        // { id: "settings" as const, title: "Settings", icon: Settings },
      ];

  const liveCompetitions = allCompetitions
    .filter(comp => getCompetitionStatus(comp) === "live")
    .map(comp => ({
      id: comp.id,
      name: comp.name,
      date: "Today",
      venue: comp.venue,
      pegsTotal: comp.pegsTotal,
      pegsAvailable: comp.pegsTotal - comp.pegsBooked,
      entryFee: comp.entryFee,
      prizePool: comp.prizePool,
      prizeType: comp.prizeType || "pool",
      status: "live" as const,
    }));

  const upcomingCompetitions = allCompetitions
    .filter(comp => getCompetitionStatus(comp) === "upcoming")
    .slice(0, 2)
    .map(comp => ({
      id: comp.id,
      name: comp.name,
      date: new Date(comp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' }),
      venue: comp.venue,
      pegsTotal: comp.pegsTotal,
      pegsAvailable: comp.pegsTotal - comp.pegsBooked,
      entryFee: comp.entryFee,
      prizePool: comp.prizePool,
      prizeType: comp.prizeType || "pool",
      status: "upcoming" as const,
    }));

  const style = {
    "--sidebar-width": "16rem",
  };

  const renderContent = () => {
    switch (activeSection) {
      case "competitions":
        return <AdminCompetitions />;
      case "teams":
        return <AdminTeams />;
      case "anglers":
        return <AdminAnglers />;
      case "sponsors":
        return <AdminSponsors />;
      case "news":
        return <AdminNews />;
      case "gallery":
        return <AdminGallery />;
      case "youtube-videos":
        return <AdminYoutubeVideos />;
      case "slider":
        return <AdminSlider />;
      case "staff":
        return <AdminStaff />;
      case "profile":
        return <AdminProfile />;
      case "settings":
        return <AdminSettings />;
      default:
        return (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Only show revenue to admin - hide from manager and marshal */}
              {admin?.role === "admin" && (
                <StatCard
                  title="Total Revenue"
                  value={dashboardStats?.totalRevenue ?? "£0"}
                  icon={Coins}
                  description="This month"
                />
              )}
              <StatCard
                title="Active Competitions"
                value={dashboardStats?.activeCompetitions?.toString() ?? "0"}
                icon={Trophy}
                description="Currently running"
              />
              <StatCard
                title="Total Anglers"
                value={dashboardStats?.totalAnglers?.toString() ?? "0"}
                icon={Users}
                description="Registered users"
              />
              <StatCard
                title="Bookings Today"
                value={dashboardStats?.bookingsToday?.toString() ?? "0"}
                icon={Calendar}
                description="New entries"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle>Live Competitions</CardTitle>
                  <Button size="sm" data-testid="button-create-competition" onClick={() => setActiveSection("competitions")}>
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </CardHeader>
                <CardContent>
                  {liveCompetitions.map((comp) => (
                    <div key={comp.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{comp.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {comp.venue}
                          </div>
                        </div>
                        <Badge className="bg-chart-4 text-white animate-pulse">
                          Live
                        </Badge>
                      </div>
                      <Button className="w-full" variant="outline" data-testid="button-manage-competition" onClick={() => setActiveSection("competitions")}>
                        Manage Competition
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentParticipations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Angler</TableHead>
                          <TableHead>Competition</TableHead>
                          <TableHead>Peg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentParticipations.slice(0, 5).map((participation: any) => (
                          <TableRow key={participation.id}>
                            <TableCell>
                              <div className="font-medium">{participation.anglerName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {participation.competitionName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {participation.pegNumber ?? "Not assigned"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recent bookings</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Upcoming Competitions</CardTitle>
                <Button variant="outline" size="sm" data-testid="button-view-all" onClick={() => setActiveSection("competitions")}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingCompetitions.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {upcomingCompetitions.map((comp) => (
                      <CompetitionCard key={comp.id} {...comp} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No upcoming competitions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  const getSectionTitle = () => {
    const section = menuItems.find(item => item.id === activeSection);
    return section ? section.title : "Dashboard";
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeSection === item.id}
                        onClick={() => setActiveSection(item.id)}
                        data-testid={`nav-${item.title.toLowerCase()}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-bold">{getSectionTitle()}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection("profile")}
                data-testid="button-profile"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                {admin.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
