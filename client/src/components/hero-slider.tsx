import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SliderImage } from "@shared/schema";

export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: sliderImages = [], isLoading } = useQuery<SliderImage[]>({
    queryKey: ["/api/slider-images"],
  });

  useEffect(() => {
    if (sliderImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  if (isLoading || sliderImages.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0">
      {sliderImages.map((image, index) => (
        <div
          key={image.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: index === currentIndex ? 1 : 0,
            backgroundImage: `url(${image.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}
