import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, Award, Handshake } from "lucide-react";
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";
import type { Sponsor } from "@shared/schema";

export default function Sponsors() {
  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "platinum":
        return { label: "Platinum", color: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900", icon: Star };
      case "gold":
        return { label: "Gold", color: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900", icon: Award };
      case "silver":
        return { label: "Silver", color: "bg-gradient-to-r from-slate-400 to-slate-500 text-slate-900", icon: Award };
      case "partner":
        return { label: "Partner", color: "bg-primary text-primary-foreground", icon: Handshake };
      default:
        return { label: tier, color: "bg-secondary", icon: Handshake };
    }
  };

  const groupedSponsors = {
    platinum: sponsors.filter((s) => s.tier === "platinum"),
    gold: sponsors.filter((s) => s.tier === "gold"),
    silver: sponsors.filter((s) => s.tier === "silver"),
    partner: sponsors.filter((s) => s.tier === "partner"),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative bg-background border-b py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-sponsors-title">
              Our Sponsors & Partners
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              We're proud to work with the best brands and organizations in UK fishing. Their support makes Peg Slam competitions possible.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Platinum Sponsors</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-16 w-32 mb-4" />
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative bg-background border-b py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-sponsors-title">
              Our Sponsors & Partners
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              We're proud to work with the best brands and organizations in UK fishing. Their support makes Peg Slam competitions possible.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="text-center py-16">
            <Handshake className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sponsors yet</h3>
            <p className="text-muted-foreground">Check back soon for our amazing sponsors and partners</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-background border-b py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-sponsors-title">
            Our Sponsors & Partners
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            We're proud to work with the best brands and organizations in UK fishing. Their support makes Peg Slam competitions possible.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        {groupedSponsors.platinum.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Platinum Sponsors</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedSponsors.platinum.map((sponsor) => {
                const tierInfo = getTierInfo(sponsor.tier);
                const TierIcon = tierInfo.icon;
                
                return (
                  <Card key={sponsor.id} className="overflow-hidden" data-testid={`card-sponsor-${sponsor.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="h-16 w-32 bg-muted rounded flex items-center justify-center">
                          {sponsor.logo ? (
                            <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-2xl font-bold text-muted-foreground">{sponsor.name[0]}</span>
                          )}
                        </div>
                        <Badge className={tierInfo.color}>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {tierInfo.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl" data-testid={`text-sponsor-name-${sponsor.id}`}>
                        {sponsor.name}
                      </CardTitle>
                      <CardDescription className="text-base">{sponsor.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-3">
                        {sponsor.website && (
                          <Button asChild data-testid={`button-sponsor-website-${sponsor.id}`}>
                            <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                              Visit Website
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {sponsor.social && (
                          <div className="flex gap-2">
                            {sponsor.social.facebook && (
                              <Button variant="outline" size="icon" asChild>
                                <a href={sponsor.social.facebook} target="_blank" rel="noopener noreferrer" data-testid={`button-sponsor-facebook-${sponsor.id}`}>
                                  <SiFacebook className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {sponsor.social.twitter && (
                              <Button variant="outline" size="icon" asChild>
                                <a href={sponsor.social.twitter} target="_blank" rel="noopener noreferrer" data-testid={`button-sponsor-twitter-${sponsor.id}`}>
                                  <SiX className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {sponsor.social.instagram && (
                              <Button variant="outline" size="icon" asChild>
                                <a href={sponsor.social.instagram} target="_blank" rel="noopener noreferrer" data-testid={`button-sponsor-instagram-${sponsor.id}`}>
                                  <SiInstagram className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {groupedSponsors.gold.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-6 w-6 text-yellow-500" />
              <h2 className="text-3xl font-bold">Gold Sponsors</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedSponsors.gold.map((sponsor) => {
                const tierInfo = getTierInfo(sponsor.tier);
                const TierIcon = tierInfo.icon;
                
                return (
                  <Card key={sponsor.id} className="hover-elevate" data-testid={`card-sponsor-${sponsor.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-12 w-24 bg-muted rounded flex items-center justify-center">
                          {sponsor.logo ? (
                            <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-xl font-bold text-muted-foreground">{sponsor.name[0]}</span>
                          )}
                        </div>
                        <Badge className={tierInfo.color}>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {tierInfo.label}
                        </Badge>
                      </div>
                      <CardTitle data-testid={`text-sponsor-name-${sponsor.id}`}>{sponsor.name}</CardTitle>
                      <CardDescription>{sponsor.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sponsor.website && (
                        <Button variant="outline" className="w-full" asChild data-testid={`button-sponsor-website-${sponsor.id}`}>
                          <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                            Visit Website
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {groupedSponsors.silver.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-6 w-6 text-slate-400" />
              <h2 className="text-3xl font-bold">Silver Sponsors</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedSponsors.silver.map((sponsor) => {
                const tierInfo = getTierInfo(sponsor.tier);
                const TierIcon = tierInfo.icon;
                
                return (
                  <Card key={sponsor.id} className="hover-elevate" data-testid={`card-sponsor-${sponsor.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-12 w-24 bg-muted rounded flex items-center justify-center">
                          {sponsor.logo ? (
                            <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-xl font-bold text-muted-foreground">{sponsor.name[0]}</span>
                          )}
                        </div>
                        <Badge className={tierInfo.color}>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {tierInfo.label}
                        </Badge>
                      </div>
                      <CardTitle data-testid={`text-sponsor-name-${sponsor.id}`}>{sponsor.name}</CardTitle>
                      <CardDescription>{sponsor.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {sponsor.website && (
                        <Button variant="outline" className="w-full" asChild data-testid={`button-sponsor-website-${sponsor.id}`}>
                          <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                            Visit Website
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {groupedSponsors.partner.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Handshake className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Official Partners</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {groupedSponsors.partner.map((sponsor) => (
                <Card key={sponsor.id} className="hover-elevate" data-testid={`card-sponsor-${sponsor.id}`}>
                  <CardHeader>
                    <div className="h-12 w-24 bg-muted rounded flex items-center justify-center mb-3">
                      {sponsor.logo ? (
                        <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-xl font-bold text-muted-foreground">{sponsor.name[0]}</span>
                      )}
                    </div>
                    <CardTitle className="text-lg" data-testid={`text-sponsor-name-${sponsor.id}`}>
                      {sponsor.name}
                    </CardTitle>
                    <CardDescription className="text-sm">{sponsor.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sponsor.website && (
                      <Button variant="ghost" className="w-full" asChild data-testid={`button-sponsor-website-${sponsor.id}`}>
                        <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                          Learn More
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
