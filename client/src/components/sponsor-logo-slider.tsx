import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, Award, Handshake } from "lucide-react";
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";
import type { Sponsor } from "@shared/schema";

export function SponsorLogoSlider() {
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  if (isLoading || sponsors.length === 0) {
    return null;
  }

  const handleSponsorClick = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setIsDialogOpen(true);
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "platinum":
        return { label: "Platinum Sponsor", color: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900", icon: Star };
      case "gold":
        return { label: "Gold Sponsor", color: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900", icon: Award };
      case "silver":
        return { label: "Silver Sponsor", color: "bg-gradient-to-r from-slate-400 to-slate-500 text-slate-900", icon: Award };
      case "partner":
        return { label: "Official Partner", color: "bg-primary text-primary-foreground", icon: Handshake };
      default:
        return { label: tier, color: "bg-secondary", icon: Handshake };
    }
  };

  return (
    <>
      <section className="w-full bg-muted/30 border-t py-12" data-testid="section-sponsor-slider">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-sponsors-heading">
              Our Sponsors & Partners
            </h2>
            <p className="text-muted-foreground">
              Proudly supported by these amazing organisations
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {sponsors.map((sponsor) => (
              <button
                key={sponsor.id}
                onClick={() => handleSponsorClick(sponsor)}
                className="flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-2"
                data-testid={`button-sponsor-logo-${sponsor.id}`}
                title={`Click to learn more about ${sponsor.name}`}
              >
                {sponsor.logo ? (
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="h-14 md:h-20 w-auto max-w-[160px] md:max-w-[200px] object-contain"
                    data-testid={`img-sponsor-logo-${sponsor.id}`}
                  />
                ) : (
                  <div className="h-14 md:h-20 px-6 flex items-center justify-center bg-card border rounded-md">
                    <span className="text-base md:text-lg font-semibold text-foreground">{sponsor.name}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedSponsor && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedSponsor.logo ? (
                    <div className="h-16 w-24 flex-shrink-0 bg-muted rounded-md flex items-center justify-center p-2">
                      <img
                        src={selectedSponsor.logo}
                        alt={selectedSponsor.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-24 flex-shrink-0 bg-muted rounded-md flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {selectedSponsor.name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl mb-2" data-testid="text-sponsor-dialog-name">
                      {selectedSponsor.name}
                    </DialogTitle>
                    {(() => {
                      const tierInfo = getTierInfo(selectedSponsor.tier);
                      const TierIcon = tierInfo.icon;
                      return (
                        <Badge className={tierInfo.color}>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {tierInfo.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </DialogHeader>
              
              <DialogDescription className="text-foreground/80 text-base leading-relaxed mt-4">
                {selectedSponsor.description || selectedSponsor.shortDescription || "No description available."}
              </DialogDescription>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                {selectedSponsor.website && (
                  <Button asChild data-testid="button-sponsor-dialog-website">
                    <a href={selectedSponsor.website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                
                {selectedSponsor.social && (
                  <div className="flex gap-2">
                    {selectedSponsor.social.facebook && (
                      <Button variant="outline" size="icon" asChild data-testid="button-sponsor-dialog-facebook">
                        <a href={selectedSponsor.social.facebook} target="_blank" rel="noopener noreferrer">
                          <SiFacebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {selectedSponsor.social.twitter && (
                      <Button variant="outline" size="icon" asChild data-testid="button-sponsor-dialog-twitter">
                        <a href={selectedSponsor.social.twitter} target="_blank" rel="noopener noreferrer">
                          <SiX className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {selectedSponsor.social.instagram && (
                      <Button variant="outline" size="icon" asChild data-testid="button-sponsor-dialog-instagram">
                        <a href={selectedSponsor.social.instagram} target="_blank" rel="noopener noreferrer">
                          <SiInstagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
