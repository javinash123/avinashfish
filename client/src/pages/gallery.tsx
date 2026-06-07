import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image, Trophy, Fish, Calendar, ChevronLeft, ChevronRight, Share2, Copy, Check } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { SiFacebook, SiX } from "react-icons/si";
import type { GalleryImage } from "@shared/schema";
import { formatWeight } from "@shared/weight-utils";
import { useToast } from "@/hooks/use-toast";

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "event" | "catch">("all");

  const { data: galleryImages = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });

  // Auto-open specific image if ?id= is in the URL
  useEffect(() => {
    if (galleryImages.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const imageId = params.get("id");
      if (imageId) {
        const found = galleryImages.find((img) => img.id === imageId);
        if (found) {
          setSelectedImage(found);
          setCurrentImageIndex(0);
        }
      }
    }
  }, [galleryImages]);

  const filteredImages = galleryImages.filter((img) => {
    if (activeTab === "all") return true;
    return img.category === activeTab;
  });
  const selectedUrls = useMemo(() => selectedImage?.urls || [], [selectedImage]);
  const selectedPreviewUrls = useMemo(() => selectedUrls.map((url) => url.replace('-optimized.webp', '')), [selectedUrls]);
  const nextImage = useCallback((direction: "prev" | "next") => {
    if (!selectedUrls.length) return;
    setCurrentImageIndex((prev) => direction === "prev"
      ? (prev === 0 ? selectedUrls.length - 1 : prev - 1)
      : (prev === selectedUrls.length - 1 ? 0 : prev + 1));
  }, [selectedUrls]);

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
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden break-inside-avoid">
                <Skeleton className="w-full h-48" />
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
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {filteredImages.map((image) => (
                <Card
                  key={image.id}
                  className="group overflow-hidden cursor-pointer hover-elevate active-elevate-2 break-inside-avoid"
                  onClick={() => {
                    setSelectedImage(image);
                    setCurrentImageIndex(0);
                  }}
                  data-testid={`card-gallery-${image.id}`}
                >
                  <div className="relative w-full overflow-hidden">
                    <img
                      src={image.urls[0].replace('-optimized.webp', '')}
                      alt={image.title}
                      className="w-full h-auto object-cover"
                    />
                    {image.urls.length > 1 && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                          <Image className="h-3 w-3 mr-1" />
                          {image.urls.length} images
                        </Badge>
                      </div>
                    )}
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
                        <span className="text-sm font-semibold">{formatWeight(image.weight)}</span>
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

      <Dialog open={!!selectedImage} onOpenChange={() => {
        setSelectedImage(null);
        setCurrentImageIndex(0);
      }}>
        <DialogContent className="max-w-4xl" data-testid="dialog-gallery-detail">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-title">{selectedImage.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative w-full h-96 overflow-hidden rounded-md bg-muted">
                  <img
                    src={selectedPreviewUrls[currentImageIndex]}
                    alt={`${selectedImage.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {selectedImage.urls.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-2 md:px-4 pointer-events-none">
                      <button
                        type="button"
                        className="bg-black/80 hover:bg-black text-white rounded-md h-8 w-8 md:h-10 md:w-10 shadow-lg flex items-center justify-center transition-colors cursor-pointer pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage("prev");
                        }}
                        data-testid="button-prev-image"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                      </button>
                      <button
                        type="button"
                        className="bg-black/80 hover:bg-black text-white rounded-md h-8 w-8 md:h-10 md:w-10 shadow-lg flex items-center justify-center transition-colors cursor-pointer pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage("next");
                        }}
                        data-testid="button-next-image"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                      </button>
                    </div>
                  )}
                  {selectedImage.urls.length > 1 && (
                    <>
                      <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        {currentImageIndex + 1} / {selectedImage.urls.length}
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {selectedImage.urls.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-2.5 rounded-full transition-all shadow-md cursor-pointer ${
                              index === currentImageIndex 
                                ? 'w-8 bg-white' 
                                : 'w-2.5 bg-white/60 hover:bg-white/90'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
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
                            {formatWeight(selectedImage.weight)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mr-1">Share:</span>
                    <Button
                      variant="outline" size="icon" className="hover-elevate"
                      onClick={() => {
                        const url = `${window.location.origin}/gallery?id=${selectedImage.id}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(selectedImage.title + ' - ' + url)}`, '_blank');
                      }}
                      data-testid="button-share-whatsapp"
                    >
                      <FaWhatsapp className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      variant="outline" size="icon" className="hover-elevate"
                      onClick={() => {
                        const url = `${window.location.origin}/gallery?id=${selectedImage.id}`;
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                      }}
                      data-testid="button-share-facebook"
                    >
                      <SiFacebook className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline" size="icon" className="hover-elevate"
                      onClick={() => {
                        const url = `${window.location.origin}/gallery?id=${selectedImage.id}`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedImage.title)}&url=${encodeURIComponent(url)}`, '_blank');
                      }}
                      data-testid="button-share-x"
                    >
                      <SiX className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline" size="icon" className="hover-elevate"
                      onClick={() => {
                        const url = `${window.location.origin}/gallery?id=${selectedImage.id}`;
                        navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        toast({ title: "Link copied!", description: "Gallery link copied to clipboard" });
                      }}
                      data-testid="button-share-copy"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
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
