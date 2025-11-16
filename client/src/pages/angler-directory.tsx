import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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

interface AnglerDirectoryResponse {
  data: AnglerListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AnglerDirectory() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "memberSince" | "club">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Build query string for API request
  const queryParams = new URLSearchParams({
    search,
    sortBy,
    sortOrder,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  const { data, isLoading} = useQuery<AnglerDirectoryResponse>({
    queryKey: [`/api/anglers?${queryParams.toString()}`],
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-") as [typeof sortBy, typeof sortOrder];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const currentSortValue = `${sortBy}-${sortOrder}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Angler Directory</h1>
          <p className="text-muted-foreground">
            Browse and connect with anglers in the Peg Slam community
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, username, or club..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-anglers"
              />
            </div>
          </div>

          <Select value={currentSortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48" data-testid="select-sort-anglers">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="memberSince-desc">Newest Members</SelectItem>
              <SelectItem value="memberSince-asc">Oldest Members</SelectItem>
              <SelectItem value="club-asc">Club (A-Z)</SelectItem>
              <SelectItem value="club-desc">Club (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Skeleton className="h-20 w-20 rounded-full mb-4" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, data.total)} of {data.total} anglers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.data.map((angler) => (
                <Link
                  key={angler.id}
                  href={`/profile/${angler.username}`}
                  data-testid={`card-angler-${angler.username}`}
                >
                  <Card className="hover-elevate h-full">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-4">
                          <AvatarImage src={angler.avatar || undefined} alt={`${angler.firstName} ${angler.lastName}`} />
                          <AvatarFallback>
                            {angler.firstName[0]}{angler.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <h3 className="font-semibold mb-1" data-testid={`text-angler-name-${angler.username}`}>
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

                        {angler.favouriteSpecies && (
                          <p className="text-xs text-muted-foreground">
                            Favourite: {angler.favouriteSpecies}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    let pageNum;
                    if (data.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= data.totalPages - 2) {
                      pageNum = data.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        onClick={() => setPage(pageNum)}
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {search ? "No anglers found matching your search." : "No anglers found."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
