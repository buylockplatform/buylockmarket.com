import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ImageGallery({ images, productName, className }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Filter out empty/null images and ensure we have at least one image
  const validImages = images.filter(img => img && img.trim() !== "");
  const displayImages = validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"];
  
  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };
  
  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };
  
  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image Display */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        <img
          src={displayImages[selectedImageIndex]}
          alt={`${productName} - Image ${selectedImageIndex + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
          data-testid={`img-main-${selectedImageIndex}`}
        />
        
        {/* Navigation arrows - only show if more than one image */}
        {displayImages.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
              onClick={handlePrevImage}
              data-testid="button-prev-image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
              onClick={handleNextImage}
              data-testid="button-next-image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Image counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>
      
      {/* Thumbnail Navigation - only show if more than one image */}
      {displayImages.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              className={cn(
                "flex-shrink-0 aspect-square w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                selectedImageIndex === index
                  ? "border-buylock-primary ring-2 ring-buylock-primary ring-offset-2"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleThumbnailClick(index)}
              data-testid={`button-thumbnail-${index}`}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}