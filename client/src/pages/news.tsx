import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Search, ArrowRight, Trophy, Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import type { News } from "@shared/schema";

interface NewsSummary {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  featured?: boolean;
  content?: string;
}

const getNewsImageUrl = (image: string | any) => {
  if (!image) return "/attached-assets/placeholder-news.jpg";
  
  // If it's an object (News with potential thumbnail fields)
  if (typeof image === 'object') {
    const thumb = image.thumbnailUrlMd || image.thumbnailUrl || image.image;
    if (!thumb) return "/attached-assets/placeholder-news.jpg";
    if (thumb.startsWith('http') || thumb.startsWith('data:') || thumb.startsWith('/')) {
      return thumb;
    }
    return `/attached-assets/uploads/news/${thumb}`;
  }

  // If it's a string
  if (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/')) {
    return image;
  }
  
  return `/attached-assets/uploads/news/${image}`;
};

interface PaginatedNewsResponse {
  news: NewsSummary[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const ITEMS_PER_PAGE = 6;

  const { data: newsData, isLoading } = useQuery<PaginatedNewsResponse>({
    queryKey: ["/api/news", currentPage, ITEMS_PER_PAGE, selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        category: selectedCategory,
        search: searchQuery
      });
      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch news");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const newsArticles = newsData?.news || [];
  const pagination = newsData?.pagination;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const handleArticleOpen = (article: NewsSummary) => {
    setLocation(`/news/${article.id}`);
  };

  // The filteredArticles now come directly from the API result
  const filteredArticles = newsArticles;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "match-report":
        return { label: "Match Report", variant: "default" as const, icon: Trophy };
      case "announcement":
        return { label: "Announcement", variant: "secondary" as const, icon: Newspaper };
      case "news":
        return { label: "News", variant: "outline" as const, icon: Newspaper };
      case "general":
        return { label: "General", variant: "outline" as const, icon: Newspaper };
      default:
        return { label: category, variant: "outline" as const, icon: Newspaper };
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-news-title">
            News & Updates
          </h1>
          <p className="text-lg text-muted-foreground">
            Stay up to date with match reports, announcements, and the latest from the UK fishing competition scene
          </p>
        </div>

        <div className="mb-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-background"
              data-testid="input-news-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              data-testid="button-filter-all"
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "match-report" ? "default" : "outline"}
              onClick={() => setSelectedCategory("match-report")}
              data-testid="button-filter-match-reports"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Match Reports
            </Button>
            <Button
              variant={selectedCategory === "announcement" ? "default" : "outline"}
              onClick={() => setSelectedCategory("announcement")}
              data-testid="button-filter-announcements"
            >
              Announcements
            </Button>
            <Button
              variant={selectedCategory === "general" ? "default" : "outline"}
              onClick={() => setSelectedCategory("general")}
              data-testid="button-filter-general"
            >
              General
            </Button>
            <Button
              variant={selectedCategory === "news" ? "default" : "outline"}
              onClick={() => setSelectedCategory("news")}
              data-testid="button-filter-news"
            >
              News
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="flex flex-col overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => {
                const categoryInfo = getCategoryBadge(article.category);
                const CategoryIcon = categoryInfo.icon;
                
                return (
                  <Card key={article.id} className="flex flex-col overflow-hidden hover-elevate" data-testid={`card-news-${article.id}`}>
                    <div className="relative w-full overflow-hidden bg-muted">
                      <img
                        src={getNewsImageUrl(article)}
                        alt={article.title}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant={categoryInfo.variant}>
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {categoryInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <h3 className="text-xl font-semibold line-clamp-2" data-testid={`text-news-title-${article.id}`}>
                        {article.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-muted-foreground line-clamp-3">{article.excerpt}</p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-4 pt-0">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{article.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleArticleOpen(article)}
                        data-testid={`button-read-more-${article.id}`}
                      >
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-16">
                <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search query" : "Check back soon for new updates"}
                </p>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      data-testid={`button-page-${page}`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
