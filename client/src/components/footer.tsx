import { Link } from "wouter";
import { Fish } from "lucide-react";
import { SiInstagram, SiFacebook, SiYoutube, SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { SiteSettings } from "@shared/schema";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/competitions", label: "Competitions" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/gallery", label: "Gallery" },
    { href: "/news", label: "News" },
    { href: "/sponsors", label: "Sponsors" },
    { href: "/contact", label: "Contact" },
  ];

  const socialLinks = [
    { 
      name: "Instagram", 
      icon: SiInstagram, 
      href: "https://www.instagram.com/pegslam/",
      testId: "link-footer-instagram"
    },
    { 
      name: "Facebook", 
      icon: SiFacebook, 
      href: "https://www.facebook.com/p/Peg-Slam-61575711046280/",
      testId: "link-footer-facebook"
    },
    { 
      name: "YouTube", 
      icon: SiYoutube, 
      href: "https://www.youtube.com/@PegSlam",
      testId: "link-footer-youtube"
    },
    { 
      name: "TikTok", 
      icon: SiTiktok, 
      href: "https://www.tiktok.com/@peg.slam",
      testId: "link-footer-tiktok"
    },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link href="/" asChild>
              <button className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" data-testid="link-footer-home">
                {siteSettings?.logoUrl ? (
                  <img 
                    src={siteSettings.logoUrl} 
                    alt="Peg Slam Logo" 
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <>
                    <Fish className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">Peg Slam</span>
                  </>
                )}
              </button>
            </Link>
            <p className="text-sm text-muted-foreground">
              UK's premier fishing competition platform. Book your peg, compete with the best, and make memories.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {navigationLinks.slice(0, 4).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} asChild>
                    <button 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate active-elevate-2 rounded px-2 py-1 -ml-2"
                      data-testid={`link-footer-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">More</h3>
            <ul className="space-y-2">
              {navigationLinks.slice(4).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} asChild>
                    <button 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate active-elevate-2 rounded px-2 py-1 -ml-2"
                      data-testid={`link-footer-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Social Media</h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Button
                    key={social.name}
                    variant="outline"
                    size="icon"
                    asChild
                    data-testid={social.testId}
                  >
                    <a 
                      href={social.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label={social.name}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left" data-testid="text-footer-copyright">
              © {currentYear} Peg Slam. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-end">
              <Link 
                href="/privacy-policy" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate active-elevate-2 rounded px-2 py-1"
                data-testid="link-footer-privacy"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms-conditions" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate active-elevate-2 rounded px-2 py-1"
                data-testid="link-footer-terms"
              >
                Terms & Conditions
              </Link>
              <Link 
                href="/cookie-policy" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate active-elevate-2 rounded px-2 py-1"
                data-testid="link-footer-cookies"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center" data-testid="text-footer-developer">
              Designed & Developed by{" "}
              <a 
                href="https://www.procodeitservices.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
                data-testid="link-footer-developer"
              >
                PROCODE IT SERVICES
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
