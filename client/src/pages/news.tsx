import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Search, ArrowRight, Trophy, Newspaper } from "lucide-react";
import type { News } from "@shared/schema";

export default function News() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<News | null>(null);

  const { data: newsArticles = [], isLoading } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const filteredArticles = newsArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "match-report":
        return { label: "Match Report", variant: "default" as const, icon: Trophy };
      case "announcement":
        return { label: "Announcement", variant: "secondary" as const, icon: Newspaper };
      case "news":
        return { label: "News", variant: "outline" as const, icon: Newspaper };
      default:
        return { label: category, variant: "outline" as const, icon: Newspaper };
    }
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

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-news-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
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
                <Skeleton className="aspect-video w-full" />
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
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
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
                        onClick={() => setSelectedArticle(article)}
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
          </>
        )}
      </div>

      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-news-detail">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-news-title">{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-md">
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {(() => {
                    const categoryInfo = getCategoryBadge(selectedArticle.category);
                    const CategoryIcon = categoryInfo.icon;
                    return (
                      <Badge variant={categoryInfo.variant}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {categoryInfo.label}
                      </Badge>
                    );
                  })()}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span data-testid="text-dialog-news-date">{selectedArticle.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{selectedArticle.readTime}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-muted-foreground font-medium">{selectedArticle.excerpt}</p>
                  <div className="prose prose-sm max-w-none" data-testid="text-dialog-news-content">
                    {selectedArticle.content.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm pt-4 border-t">
                    <span className="text-muted-foreground">By {selectedArticle.author}</span>
                    {selectedArticle.competition && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span data-testid="text-dialog-news-competition">{selectedArticle.competition}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
