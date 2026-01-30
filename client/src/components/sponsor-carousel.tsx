import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website?: string;
  featuredAboveFooter?: boolean;
}

interface SponsorCarouselProps {
  sponsors: Sponsor[];
}

export function SponsorCarousel({ sponsors }: SponsorCarouselProps) {
  const featuredSponsors = sponsors.filter(s => s.featuredAboveFooter !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || featuredSponsors.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredSponsors.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, featuredSponsors.length]);

  const visibleSponsors = featuredSponsors.length > 0 
    ? [
        featuredSponsors[currentIndex % featuredSponsors.length],
        featuredSponsors[(currentIndex + 1) % featuredSponsors.length],
        featuredSponsors[(currentIndex + 2) % featuredSponsors.length],
      ]
    : [];

  return (
    <div
      className="w-full py-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h3 className="text-center text-sm font-medium text-muted-foreground mb-6">
        Our Sponsors
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {visibleSponsors.map((sponsor, idx) => (
          <Card
            key={`${sponsor.id}-${idx}`}
            className="p-6 flex items-center justify-center hover-elevate transition-all bg-white"
            data-testid={`card-sponsor-${sponsor.id}`}
          >
            <div className="text-center">
              {sponsor.logo ? (
                <img src={sponsor.logo} alt={sponsor.name} className="h-12 w-auto object-contain" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {sponsor.name}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
