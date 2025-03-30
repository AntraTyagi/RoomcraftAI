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

  // Function to proxy image URLs if they're external
  const getProxiedImageUrl = (originalUrl: string) => {
    return originalUrl.startsWith('http') 
      ? `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`
      : originalUrl;
  };
  
  const proxiedBeforeImage = getProxiedImageUrl(beforeImage);
  const proxiedAfterImage = getProxiedImageUrl(afterImage);

  return (
    <Card className={`relative overflow-hidden select-none ${className}`}>
      <div
        id="comparison-slider"
        className="relative w-full aspect-[4/3]"
      >
        {/* After Image (Full) */}
        <img
          src={proxiedAfterImage}
          alt="After staging"
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            console.error("Error loading after image:", e);
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjOTk5OTk5Ij5BZnRlciBpbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg==';
          }}
        />

        {/* Before Image (Partial) */}
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={proxiedBeforeImage}
            alt="Before staging"
            className="absolute top-0 left-0 w-full h-full object-cover"
            onError={(e) => {
              console.error("Error loading before image:", e);
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjOTk5OTk5Ij5CZWZvcmUgaW1hZ2UgbG9hZCBlcnJvcjwvdGV4dD48L3N2Zz4=';
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
