import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AnglerListing {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  club: string | null;
  avatar: string | null;
  location: string | null;
  favouriteMethod: string | null;
  favouriteSpecies: string | null;
  memberSince: string;
}

export default function Ambassadors() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "memberSince" | "club">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<AnglerListing[]>({
    queryKey: ["/api/ambassadors"],
  });

  const filteredAmbassadors = (data || [])
    .filter((angler) => {
      const searchLower = search.toLowerCase();
      return (
        angler.firstName.toLowerCase().includes(searchLower) ||
        angler.lastName.toLowerCase().includes(searchLower) ||
        angler.username.toLowerCase().includes(searchLower) ||
        (angler.club || "").toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortBy === "memberSince") {
        const dateA = new Date(a.memberSince).getTime();
        const dateB = new Date(b.memberSince).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === "club") {
        const clubA = (a.club || "").toLowerCase();
        const clubB = (b.club || "").toLowerCase();
        return sortOrder === "asc" ? clubA.localeCompare(clubB) : clubB.localeCompare(clubA);
      }
      return 0;
    });

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-") as [typeof sortBy, typeof sortOrder];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const currentSortValue = `${sortBy}-${sortOrder}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Our Ambassadors</h1>
          <p className="text-muted-foreground">
            Meet the professional anglers representing Peg Slam
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search ambassadors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={currentSortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="memberSince-desc">Newest</SelectItem>
              <SelectItem value="memberSince-asc">Oldest</SelectItem>
              <SelectItem value="club-asc">Club (A-Z)</SelectItem>
              <SelectItem value="club-desc">Club (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Skeleton className="h-20 w-20 rounded-full mb-4" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAmbassadors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAmbassadors.map((angler) => (
              <div
                key={angler.id}
                onClick={() => setLocation(`/profile/${angler.username}`)}
                className="cursor-pointer"
              >
                <Card className="hover-elevate h-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={angler.avatar || undefined} alt={`${angler.firstName} ${angler.lastName}`} className="object-cover" />
                        <AvatarFallback className="text-2xl">
                          {angler.firstName[0]}{angler.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-semibold mb-1">
                        {angler.firstName} {angler.lastName}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        @{angler.username}
                      </p>

                      {angler.club && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Users className="h-3 w-3" />
                          <span>{angler.club}</span>
                        </div>
                      )}

                      {angler.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{angler.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No ambassadors found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
