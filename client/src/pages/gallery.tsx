import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image, Trophy, Fish, Calendar } from "lucide-react";
import type { GalleryImage } from "@shared/schema";

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "event" | "catch">("all");

  const { data: galleryImages = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });

  const filteredImages = galleryImages.filter((img) => {
    if (activeTab === "all") return true;
    return img.category === activeTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-gallery-title">
            Gallery
          </h1>
          <p className="text-lg text-muted-foreground">
            Relive the best moments from our competitions - from epic catches to unforgettable events
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-8">
          <TabsList data-testid="tabs-gallery-filter">
            <TabsTrigger value="all" data-testid="tab-all">
              <Image className="h-4 w-4 mr-2" />
              All Photos
            </TabsTrigger>
            <TabsTrigger value="event" data-testid="tab-events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="catch" data-testid="tab-catches">
              <Fish className="h-4 w-4 mr-2" />
              Big Catches
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredImages.map((image) => (
                <Card
                  key={image.id}
                  className="group overflow-hidden cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => setSelectedImage(image)}
                  data-testid={`card-gallery-${image.id}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant={image.category === "catch" ? "default" : "secondary"}>
                        {image.category === "catch" ? (
                          <>
                            <Fish className="h-3 w-3 mr-1" />
                            Catch
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3 mr-1" />
                            Event
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1" data-testid={`text-gallery-title-${image.id}`}>
                      {image.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
                    {image.weight && (
                      <div className="flex items-center gap-2 mt-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{image.weight}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {filteredImages.length === 0 && (
              <div className="text-center py-16">
                <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No photos found</h3>
                <p className="text-muted-foreground">Try adjusting your filter selection</p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl" data-testid="dialog-gallery-detail">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-title">{selectedImage.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-md">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-muted-foreground">{selectedImage.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-dialog-date">{selectedImage.date}</span>
                    </div>
                    {selectedImage.competition && (
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span data-testid="text-dialog-competition">{selectedImage.competition}</span>
                      </div>
                    )}
                  </div>
                  {selectedImage.category === "catch" && selectedImage.angler && (
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Angler</p>
                        <p className="font-semibold" data-testid="text-dialog-angler">
                          {selectedImage.angler}
                        </p>
                      </div>
                      {selectedImage.weight && (
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="font-semibold text-primary" data-testid="text-dialog-weight">
                            {selectedImage.weight}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
