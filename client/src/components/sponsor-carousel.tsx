import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website?: string;
}

interface SponsorCarouselProps {
  sponsors: Sponsor[];
}

export function SponsorCarousel({ sponsors }: SponsorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || sponsors.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, sponsors.length]);

  const visibleSponsors = sponsors.length > 0 
    ? [
        sponsors[currentIndex % sponsors.length],
        sponsors[(currentIndex + 1) % sponsors.length],
        sponsors[(currentIndex + 2) % sponsors.length],
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
            className="p-6 flex items-center justify-center hover-elevate transition-all grayscale hover:grayscale-0"
            data-testid={`card-sponsor-${sponsor.id}`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {sponsor.name}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
