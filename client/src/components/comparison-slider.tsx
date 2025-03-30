import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  className = "",
}: ComparisonSliderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState(50);

  const handleMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isResizing) return;

      const clientX = 'touches' in event 
        ? event.touches[0].clientX 
        : event.clientX;

      const slider = document.getElementById('comparison-slider');
      if (!slider) return;

      const rect = slider.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));

      setPosition(percent);
    },
    [isResizing]
  );

  const handleResize = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchend', stopResize);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('touchend', stopResize);
    };
  }, [handleMove, stopResize]);

  console.log("ComparisonSlider - beforeImage:", beforeImage);
  console.log("ComparisonSlider - afterImage:", afterImage);

  // Fallback SVG for when images fail to load
  const fallbackSVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjOTk5OTk5Ij5JbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg==';
  
  // Known good fallback image from Unsplash for worst-case scenarios
  const fallbackImage = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";

  return (
    <Card className={`relative overflow-hidden select-none ${className}`}>
      <div
        id="comparison-slider"
        className="relative w-full aspect-[4/3]"
      >
        {/* After Image (Full) */}
        <img
          src={afterImage}
          alt="After staging"
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            console.error("Error loading after image directly:", e);
            
            // Try proxy as fallback
            if (afterImage.startsWith('http')) {
              (e.target as HTMLImageElement).src = `/api/proxy-image?url=${encodeURIComponent(afterImage)}`;
              
              // Add a second error handler for the proxy attempt
              (e.target as HTMLImageElement).onerror = (e2) => {
                console.error("Error loading after image through proxy:", e2);
                // If proxy also fails, use a known good fallback
                (e.target as HTMLImageElement).src = fallbackImage;
              };
            } else {
              // For data URLs, use fallback SVG
              (e.target as HTMLImageElement).src = fallbackSVG;
            }
          }}
        />

        {/* Before Image (Partial) */}
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={beforeImage}
            alt="Before staging"
            className="absolute top-0 left-0 w-full h-full object-cover"
            onError={(e) => {
              console.error("Error loading before image directly:", e);
              
              // Try proxy as fallback
              if (beforeImage.startsWith('http')) {
                (e.target as HTMLImageElement).src = `/api/proxy-image?url=${encodeURIComponent(beforeImage)}`;
                
                // Add a second error handler for the proxy attempt
                (e.target as HTMLImageElement).onerror = (e2) => {
                  console.error("Error loading before image through proxy:", e2);
                  // If proxy also fails, use a known good fallback
                  (e.target as HTMLImageElement).src = fallbackImage;
                };
              } else {
                // For data URLs, use fallback SVG
                (e.target as HTMLImageElement).src = fallbackSVG;
              }
            }}
          />
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: `${position}%` }}
          onMouseDown={handleResize}
          onTouchStart={handleResize}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-ew-resize">
            <div className="w-0.5 h-4 bg-gray-400 rounded-full mx-0.5" />
            <div className="w-0.5 h-4 bg-gray-400 rounded-full mx-0.5" />
          </div>
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white" />
        </div>
      </div>
    </Card>
  );
}
