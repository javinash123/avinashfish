import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Fish, Menu, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/competitions", label: "Competitions" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/gallery", label: "Gallery" },
    { href: "/news", label: "News" },
    { href: "/sponsors", label: "Sponsors" },
  ];

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" asChild>
            <button className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" data-testid="link-home">
              {siteSettings?.logoUrl ? (
                <img 
                  src={siteSettings.logoUrl} 
                  alt="Logo" 
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <>
                  <Fish className="h-7 w-7 text-primary" />
                  <span className="text-xl font-bold">Peg Slam</span>
                </>
              )}
            </button>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} asChild>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover-elevate active-elevate-2 ${
                    location === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-foreground"
                  }`}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-profile">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.firstName} {user?.lastName}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-profile">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={async () => {
                      try {
                        await apiRequest("POST", "/api/user/logout");
                        queryClient.setQueryData(["/api/user/me"], null);
                        await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
                        toast({
                          title: "Logged out",
                          description: "You have been logged out successfully.",
                        });
                        setLocation("/");
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to logout",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="menu-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" asChild>
                <Button variant="ghost" size="icon" data-testid="button-login">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link href="/competitions" asChild>
              <Button className="hidden md:inline-flex" data-testid="button-book-peg">
                Book a Peg
              </Button>
            </Link>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-2 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} asChild>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                        }}
                        className={`px-4 py-3 rounded-md text-sm font-medium hover-elevate active-elevate-2 text-left ${
                          location === item.href
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : ""
                        }`}
                        data-testid={`link-mobile-${item.label.toLowerCase()}`}
                      >
                        {item.label}
                      </button>
                    </Link>
                  ))}
                  <Link href="/competitions" asChild>
                    <Button 
                      className="mt-4 w-full" 
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="button-mobile-book-peg"
                    >
                      Book a Peg
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
