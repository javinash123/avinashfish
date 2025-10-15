import { Link } from "wouter";
import { Fish, Mail, Phone, MapPin } from "lucide-react";
import { SiInstagram, SiFacebook, SiYoutube } from "react-icons/si";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/competitions", label: "Competitions" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/gallery", label: "Gallery" },
    { href: "/news", label: "News" },
    { href: "/sponsors", label: "Sponsors" },
    { href: "/about", label: "About" },
  ];

  const socialLinks = [
    { 
      name: "Instagram", 
      icon: SiInstagram, 
      href: "https://instagram.com/pegslam",
      testId: "link-footer-instagram"
    },
    { 
      name: "Facebook", 
      icon: SiFacebook, 
      href: "https://facebook.com/pegslam",
      testId: "link-footer-facebook"
    },
    { 
      name: "YouTube", 
      icon: SiYoutube, 
      href: "https://youtube.com/@pegslam",
      testId: "link-footer-youtube"
    },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link href="/" asChild>
              <button className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" data-testid="link-footer-home">
                <Fish className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Peg Slam</span>
              </button>
            </Link>
            <p className="text-sm text-muted-foreground">
              UK's premier fishing competition platform. Book your peg, compete with the best, and make memories.
            </p>
            <div className="flex gap-2">
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
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a 
                  href="mailto:info@pegslam.co.uk" 
                  className="hover:text-foreground transition-colors"
                  data-testid="link-footer-email"
                >
                  info@pegslam.co.uk
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a 
                  href="tel:+441234567890" 
                  className="hover:text-foreground transition-colors"
                  data-testid="link-footer-phone"
                >
                  +44 1234 567890
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span data-testid="text-footer-address">
                  123 Fishing Lane<br />
                  London, UK<br />
                  SW1A 1AA
                </span>
              </li>
            </ul>
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
        </div>
      </div>
    </footer>
  );
}
