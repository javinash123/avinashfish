import { ThemeProvider } from "../theme-provider";
import { SponsorCarousel } from "../sponsor-carousel";

export default function SponsorCarouselExample() {
  const mockSponsors = [
    { id: "1", name: "Tackle Pro", logo: "" },
    { id: "2", name: "Carp Masters", logo: "" },
    { id: "3", name: "Lake View", logo: "" },
    { id: "4", name: "Fishing Gear UK", logo: "" },
    { id: "5", name: "Bait Solutions", logo: "" },
  ];

  return (
    <ThemeProvider>
      <div className="p-8">
        <SponsorCarousel sponsors={mockSponsors} />
      </div>
    </ThemeProvider>
  );
}
