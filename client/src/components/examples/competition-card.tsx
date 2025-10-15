import { ThemeProvider } from "../theme-provider";
import { CompetitionCard } from "../competition-card";

export default function CompetitionCardExample() {
  return (
    <ThemeProvider>
      <div className="p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl">
        <CompetitionCard
          id="1"
          name="Spring Carp Qualifier"
          date="15th March 2024"
          venue="Willow Lake Fishery"
          pegsTotal={40}
          pegsAvailable={12}
          entryFee="£45"
          prizePool="£1,200"
          status="upcoming"
        />
        <CompetitionCard
          id="2"
          name="Summer Open Championship"
          date="22nd June 2024"
          venue="Oak Tree Lakes"
          pegsTotal={60}
          pegsAvailable={0}
          entryFee="£65"
          prizePool="£3,500"
          status="live"
        />
        <CompetitionCard
          id="3"
          name="Junior Match Final"
          date="10th February 2024"
          venue="Mill Pond Complex"
          pegsTotal={30}
          pegsAvailable={0}
          entryFee="£25"
          prizePool="£800"
          status="completed"
        />
      </div>
    </ThemeProvider>
  );
}
