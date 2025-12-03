import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Users, Shield } from "lucide-react";

interface TeamMember {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  isPrimary: boolean;
  club: string;
  status: string;
}

interface TeamDetails {
  id: string;
  teamName: string;
  createdBy: string;
  createdAt: string;
  pegNumber: number | null;
  competitionId: string;
  members: TeamMember[];
  captainName: string;
  captainUsername: string;
}

export default function TeamProfile() {
  const { teamId } = useParams<{ teamId: string }>();

  const { data: team, isLoading } = useQuery<TeamDetails>({
    queryKey: [`/api/team/${teamId}`],
    enabled: !!teamId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">Loading team details...</div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">Team not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Team Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{team.teamName}</h1>
          </div>
          <p className="text-muted-foreground">
            Team members and details
          </p>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {team.members.map((member) => (
            <Card key={member.userId} className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 shrink-0">
                    <AvatarImage src={member.avatar} className="object-cover" />
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/profile/${member.username}`}>
                        <a className="font-semibold text-base hover:text-primary transition-colors truncate">
                          {member.name}
                        </a>
                      </Link>
                      {member.isPrimary && (
                        <Badge variant="default" className="flex items-center gap-1 shrink-0">
                          <Shield className="h-3 w-3" />
                          Captain
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">@{member.username}</p>
                    {member.club && (
                      <p className="text-sm text-muted-foreground">{member.club}</p>
                    )}
                    <div className="mt-3">
                      <Badge 
                        variant="outline"
                        className={member.status === "accepted" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" : ""}
                      >
                        {member.status === "accepted" ? "✓ Accepted" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
