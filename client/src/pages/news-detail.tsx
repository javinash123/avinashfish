import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Trophy, Newspaper, Share2, ChevronLeft } from "lucide-react";
import { SiFacebook, SiX } from "react-icons/si";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import type { News } from "@shared/schema";
import { useEffect } from "react";
import { updateMetaTags, resetMetaTags } from "@/lib/meta-tags";

const getNewsImageUrl = (article: News | any) => {
  if (!article) return "/attached-assets/placeholder-news.jpg";
  
  const imagePath = article.image;
  if (!imagePath) return "/attached-assets/placeholder-news.jpg";
  
  if (imagePath.startsWith('http') || imagePath.startsWith('data:') || imagePath.startsWith('/')) {
    return imagePath;
  }
  return `/attached-assets/uploads/news/${imagePath}`;
};

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

export default function NewsDetail() {
  const [, params] = useRoute("/news/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params?.id;

  const { data: article, isLoading, error } = useQuery<News>({
    queryKey: ["/api/news", id],
    queryFn: async () => {
      const response = await fetch(`/api/news/${id}`);
      if (!response.ok) throw new Error("Failed to fetch article");
      return response.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    notifyOnChangeProps: ['data', 'isLoading', 'error'],
  });

  useEffect(() => {
    if (article) {
      updateMetaTags({
        title: article.title,
        description: article.excerpt,
        image: article.image,
        url: window.location.href,
        type: 'article',
      });
    }
    return () => resetMetaTags();
  }, [article]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-2/3 mb-6" />
        <Skeleton className="w-full h-96 rounded-xl mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Article not found</h2>
        <Button onClick={() => setLocation("/news")}>Back to News</Button>
      </div>
    );
  }

  const categoryInfo = getCategoryBadge(article.category);
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6 hover-elevate" 
          onClick={() => setLocation("/news")}
          data-testid="button-back-to-news"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to News
        </Button>

        <article>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={categoryInfo.variant}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {categoryInfo.label}
              </Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground" data-testid="text-news-detail-title">
              {article.title}
            </h1>
          </div>

          <div className="relative w-full overflow-hidden rounded-xl bg-muted mb-8 border shadow-sm min-h-[400px] md:min-h-[600px]">
            <img
              src={getNewsImageUrl(article)}
              alt={article.title}
              className="w-full h-auto object-contain max-h-[800px] bg-black/5"
              fetchPriority="high"
              loading="eager"
              width="1200"
              height="630"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.complete) {
                  img.classList.add('opacity-100');
                }
              }}
            />
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl font-medium text-muted-foreground mb-8 leading-relaxed">
              {article.excerpt}
            </p>
            <div 
              className="text-foreground space-y-4"
              dangerouslySetInnerHTML={{ __html: article.content }} 
              data-testid="text-news-detail-content"
            />
          </div>

          <footer className="mt-12 pt-8 border-t">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">By <span className="text-foreground font-medium">{article.author}</span></span>
                {article.competition && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-medium">{article.competition}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2">Share:</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="hover-elevate"
                  onClick={() => {
                    const url = window.location.href;
                    window.open(`https://wa.me/?text=${encodeURIComponent(article.title + ' - ' + url)}`, '_blank');
                  }}
                  data-testid="button-share-whatsapp"
                >
                  <FaWhatsapp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="hover-elevate"
                  onClick={() => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                  }}
                  data-testid="button-share-facebook"
                >
                  <SiFacebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="hover-elevate"
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                  }}
                  data-testid="button-share-x"
                >
                  <SiX className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="ml-2 hover-elevate"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link copied",
                      description: "Article link copied to clipboard",
                    });
                  }}
                  data-testid="button-copy-link"
                >
                  Copy Link
                </Button>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
