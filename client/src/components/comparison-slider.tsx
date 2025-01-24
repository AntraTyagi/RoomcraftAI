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
