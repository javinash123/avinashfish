import { ThemeProvider } from "../theme-provider";
import { StatCard } from "../stat-card";
import { Users, Trophy, Calendar, Coins } from "lucide-react";

export default function StatCardExample() {
  return (
    <ThemeProvider>
      <div className="p-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-7xl">
        <StatCard
          title="Total Anglers"
          value="1,284"
          icon={Users}
          description="Registered competitors"
          trend="+12% from last month"
        />
        <StatCard
          title="Active Competitions"
          value="8"
          icon={Trophy}
          description="Currently running"
        />
        <StatCard
          title="Upcoming Events"
          value="15"
          icon={Calendar}
          description="Next 3 months"
        />
        <StatCard
          title="Total Prize Pool"
          value="£18.5k"
          icon={Coins}
          description="This season"
        />
      </div>
    </ThemeProvider>
  );
}
