import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Star, Award, Handshake, Mail } from "lucide-react";
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";
import type { Sponsor } from "@shared/schema";

export default function Sponsors() {
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const handleReadMore = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setIsDialogOpen(true);
  };

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
              We're proud to work with the best brands and organisations in UK fishing. Their support makes Peg Slam competitions possible.
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
              We're proud to work with the best brands and organisations in UK fishing. Their support makes Peg Slam competitions possible.
            </p>
          </div>
        </div>

        {/* Why Sponsor Section */}
        <section className="bg-muted/30 border-y py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Why Sponsor Peg Slam?</h2>
            <p className="text-lg text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
              Partner with the UK's premier fishing competition platform and connect with thousands of passionate anglers across the country.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Reach Your Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Connect directly with dedicated match anglers, recreational fishers, and fishing enthusiasts through our platform and live events.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Brand Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Showcase your brand across our digital platform, competition materials, and at prestigious fishing venues throughout the UK.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-primary" />
                    Community Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Support the growth of competitive fishing in the UK and help create memorable experiences for anglers of all skill levels.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    Marketing Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Benefit from social media exposure, event branding, product placement, and direct engagement opportunities with your target market.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-card border rounded-lg p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Sponsorship Tiers</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-primary" />
                    <h4 className="text-xl font-semibold">Platinum Sponsors</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Premium exposure with featured placement, event naming rights, exclusive branding opportunities, and comprehensive marketing packages.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <h4 className="text-xl font-semibold">Gold Sponsors</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Prominent branding across platform and events, social media features, logo placement, and partnership announcements.
                  </p>
                </div>

                <div className="border-l-4 border-slate-400 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-slate-400" />
                    <h4 className="text-xl font-semibold">Silver Sponsors</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Website presence, event materials inclusion, and recognition across our growing fishing community.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Handshake className="h-5 w-5 text-primary" />
                    <h4 className="text-xl font-semibold">Partners</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Join our network of valued partners supporting UK fishing competitions with brand visibility and community engagement.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Interested in Sponsoring?</h3>
              <p className="text-muted-foreground mb-6">
                Contact us to discuss partnership opportunities and custom sponsorship packages tailored to your business goals.
              </p>
              <Button asChild size="lg">
                <a href="/contact" data-testid="button-become-sponsor">
                  <Mail className="mr-2 h-4 w-4" />
                  Become a Sponsor
                </a>
              </Button>
            </div>
          </div>
        </section>

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
            We're proud to work with the best brands and organisations in UK fishing. Their support makes Peg Slam competitions possible.
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
                      <CardDescription className="text-base">
                        {(() => {
                          const desc = sponsor.shortDescription || sponsor.description || "";
                          return desc.length > 150 ? `${desc.substring(0, 150)}...` : desc;
                        })()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button 
                          variant="secondary"
                          onClick={() => handleReadMore(sponsor)}
                          data-testid={`button-read-more-${sponsor.id}`}
                        >
                          Read More
                        </Button>
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
                      <CardDescription>
                        {(() => {
                          const desc = sponsor.shortDescription || sponsor.description || "";
                          return desc.length > 150 ? `${desc.substring(0, 150)}...` : desc;
                        })()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleReadMore(sponsor)}
                          data-testid={`button-read-more-${sponsor.id}`}
                        >
                          Read More
                        </Button>
                        {sponsor.website && (
                          <Button variant="outline" className="w-full" asChild data-testid={`button-sponsor-website-${sponsor.id}`}>
                            <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                              Visit Website
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
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
                      <CardDescription>
                        {(() => {
                          const desc = sponsor.shortDescription || sponsor.description || "";
                          return desc.length > 150 ? `${desc.substring(0, 150)}...` : desc;
                        })()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleReadMore(sponsor)}
                          data-testid={`button-read-more-${sponsor.id}`}
                        >
                          Read More
                        </Button>
                        {sponsor.website && (
                          <Button variant="outline" className="w-full" asChild data-testid={`button-sponsor-website-${sponsor.id}`}>
                            <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                              Visit Website
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
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
                    <CardDescription className="text-sm">
                      {(() => {
                        const desc = sponsor.shortDescription || sponsor.description || "";
                        return desc.length > 150 ? `${desc.substring(0, 150)}...` : desc;
                      })()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="secondary"
                        className="w-full"
                        onClick={() => handleReadMore(sponsor)}
                        data-testid={`button-read-more-${sponsor.id}`}
                      >
                        Read More
                      </Button>
                      {sponsor.website && (
                        <Button variant="ghost" className="w-full" asChild data-testid={`button-sponsor-website-${sponsor.id}`}>
                          <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                            Learn More
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Why Sponsor Section */}
      <section className="bg-muted/30 border-y py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Why Sponsor Peg Slam?</h2>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
            Partner with the UK's premier fishing competition platform and connect with thousands of passionate anglers across the country.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Reach Your Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect directly with dedicated match anglers, recreational fishers, and fishing enthusiasts through our platform and live events.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Brand Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Showcase your brand across our digital platform, competition materials, and at prestigious fishing venues throughout the UK.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-primary" />
                  Community Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Support the growth of competitive fishing in the UK and help create memorable experiences for anglers of all skill levels.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Marketing Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Benefit from social media exposure, event branding, product placement, and direct engagement opportunities with your target market.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card border rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Sponsorship Tiers</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <h4 className="text-xl font-semibold">Platinum Sponsors</h4>
                </div>
                <p className="text-muted-foreground">
                  Premium exposure with featured placement, event naming rights, exclusive branding opportunities, and comprehensive marketing packages.
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <h4 className="text-xl font-semibold">Gold Sponsors</h4>
                </div>
                <p className="text-muted-foreground">
                  Prominent branding across platform and events, social media features, logo placement, and partnership announcements.
                </p>
              </div>

              <div className="border-l-4 border-slate-400 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-slate-400" />
                  <h4 className="text-xl font-semibold">Silver Sponsors</h4>
                </div>
                <p className="text-muted-foreground">
                  Website presence, event materials inclusion, and recognition across our growing fishing community.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Handshake className="h-5 w-5 text-primary" />
                  <h4 className="text-xl font-semibold">Partners</h4>
                </div>
                <p className="text-muted-foreground">
                  Join our network of valued partners supporting UK fishing competitions with brand visibility and community engagement.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Interested in Sponsoring?</h3>
            <p className="text-muted-foreground mb-6">
              Contact us to discuss partnership opportunities and custom sponsorship packages tailored to your business goals.
            </p>
            <Button asChild size="lg">
              <a href="/contact" data-testid="button-become-sponsor">
                <Mail className="mr-2 h-4 w-4" />
                Become a Sponsor
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Sponsor Peg Slam Section */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="mt-8">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-3xl" data-testid="text-become-sponsor-title">Sponsor Peg Slam</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="opacity-90">
                Peg Slam is more than a fishing competition — it's a growing national platform that inspires anglers of all ages, connects communities, and promotes responsible, competitive angling.
                Every event, prize, and opportunity exists thanks to the support of sponsors and partners who share that vision.
              </p>

              <h3 className="text-xl font-semibold pt-2">Why Sponsor Peg Slam?</h3>
              <p className="opacity-90">
                Partnering with Peg Slam gives your brand visibility, credibility, and a direct link to one of the UK's fastest-growing community angling networks.
              </p>

              <h3 className="text-xl font-semibold pt-2">How Your Support Helps</h3>
              <p className="opacity-90">
                Your sponsorship funds go directly into supporting junior, youth, and adult competitions, providing prizes, coaching, and development sessions, improving event facilities and safety, and promoting environmental awareness and responsible angling.
              </p>

              <h3 className="text-xl font-semibold pt-2">Ways to Get Involved</h3>
              <ul className="space-y-2 ml-4 opacity-90">
                <li className="flex gap-2">
                  <span>•</span>
                  <span><strong>Main Event Sponsor</strong> – full branding, media coverage, and lead recognition.</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span><strong>Peg Sponsor</strong> – name or company logo displayed on match pegs and event posts.</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span><strong>Prize or Product Sponsor</strong> – provide bait, tackle, or vouchers.</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span><strong>Community Partner</strong> – help us deliver youth and outreach projects.</span>
                </li>
              </ul>

              <p className="opacity-90 pt-2">
                If your company values community, youth development, and real sport, Peg Slam is the perfect partnership.
              </p>

              <div className="pt-4">
                <Button variant="secondary" asChild data-testid="button-sponsor-contact">
                  <a href="mailto:info@pegslam.com">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Us About Sponsorship
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedSponsor && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="h-20 w-40 bg-muted rounded flex items-center justify-center">
                    {selectedSponsor.logo ? (
                      <img 
                        src={selectedSponsor.logo} 
                        alt={selectedSponsor.name} 
                        className="h-full w-full object-contain p-2" 
                      />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground">{selectedSponsor.name[0]}</span>
                    )}
                  </div>
                  <Badge className={getTierInfo(selectedSponsor.tier).color}>
                    {(() => {
                      const tierInfo = getTierInfo(selectedSponsor.tier);
                      const TierIcon = tierInfo.icon;
                      return (
                        <>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {tierInfo.label}
                        </>
                      );
                    })()}
                  </Badge>
                </div>
                <DialogTitle className="text-3xl" data-testid="dialog-sponsor-title">
                  {selectedSponsor.name}
                </DialogTitle>
                {selectedSponsor.website && (
                  <DialogDescription asChild>
                    <a 
                      href={selectedSponsor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                      data-testid="dialog-sponsor-website"
                    >
                      {selectedSponsor.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">About</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedSponsor.description}
                  </p>
                </div>

                {selectedSponsor.social && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Connect with {selectedSponsor.name}</h4>
                    <div className="flex gap-3">
                      {selectedSponsor.social.facebook && (
                        <Button variant="outline" size="lg" asChild>
                          <a href={selectedSponsor.social.facebook} target="_blank" rel="noopener noreferrer">
                            <SiFacebook className="h-5 w-5 mr-2" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {selectedSponsor.social.twitter && (
                        <Button variant="outline" size="lg" asChild>
                          <a href={selectedSponsor.social.twitter} target="_blank" rel="noopener noreferrer">
                            <SiX className="h-5 w-5 mr-2" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {selectedSponsor.social.instagram && (
                        <Button variant="outline" size="lg" asChild>
                          <a href={selectedSponsor.social.instagram} target="_blank" rel="noopener noreferrer">
                            <SiInstagram className="h-5 w-5 mr-2" />
                            Instagram
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {selectedSponsor.website && (
                  <div className="pt-4 border-t">
                    <Button className="w-full" size="lg" asChild>
                      <a href={selectedSponsor.website} target="_blank" rel="noopener noreferrer">
                        Visit {selectedSponsor.name} Website
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
