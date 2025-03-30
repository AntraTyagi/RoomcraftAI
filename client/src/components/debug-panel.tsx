import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DebugPanelProps {
  inputImage?: string | null;
  maskImage?: string | null;
  visualizationImage?: string | null;
  prompt?: string | null;
}

export default function DebugPanel({
  inputImage,
  maskImage,
  visualizationImage,
  prompt
}: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!inputImage && !maskImage && !visualizationImage && !prompt) {
    return null;
  }

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Debug Information</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 mr-2" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          {isVisible ? "Hide" : "Show"} Debug Info
        </Button>
      </div>

      {isVisible && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inputImage && (
              <div>
                <p className="text-sm font-medium mb-2">Input Image</p>
                <img
                  src={inputImage}
                  alt="Input"
                  className="w-full rounded-lg border"
                />
              </div>
            )}
            {maskImage && (
              <div>
                <p className="text-sm font-medium mb-2">Mask</p>
                <img
                  src={maskImage}
                  alt="Mask"
                  className="w-full rounded-lg border"
                />
              </div>
            )}
            {visualizationImage && (
              <div>
                <p className="text-sm font-medium mb-2">Visualization</p>
                <img
                  src={visualizationImage}
                  alt="Visualization"
                  className="w-full rounded-lg border"
                  onError={(e) => {
                    console.error("Error loading visualization image directly:", e);
                    // Try proxy as fallback
                    if (visualizationImage.startsWith('http')) {
                      (e.target as HTMLImageElement).src = `/api/proxy-image?url=${encodeURIComponent(visualizationImage)}`;
                      
                      // Add a second error handler for the proxy attempt
                      (e.target as HTMLImageElement).onerror = (e2) => {
                        console.error("Error loading visualization image through proxy:", e2);
                        // If proxy also fails, use fallback SVG
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjOTk5OTk5Ij5JbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg==';
                      };
                    } else {
                      // For data URLs, just use fallback SVG
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjOTk5OTk5Ij5JbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg==';
                    }
                  }}
                />
              </div>
            )}
          </div>

          {prompt && (
            <div>
              <p className="text-sm font-medium mb-2">Inpainting Prompt</p>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono">{prompt}</pre>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}