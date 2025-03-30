import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DesignGalleryProps {
  designs: string[];
}

export default function DesignGallery({ designs }: DesignGalleryProps) {
  // Direct download without proxy
  const handleDownload = (url: string) => {
    // Open in new tab to download
    window.open(url, '_blank');
  };

  console.log("DesignGallery received designs:", designs);

  if (!designs || designs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No designs available to display.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {designs.map((design, index) => {
        console.log(`Rendering design ${index}:`, design);
        // Apply a hardcoded image for testing
        const fallbackImage = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";
        
        return (
          <Card key={index} className="overflow-hidden group relative">
            {/* First try direct URL */}
            <img
              src={design}
              alt={`Generated design ${index + 1}`}
              className="w-full h-64 object-cover"
              onError={(e) => {
                console.error(`Error loading image ${index} directly:`, e);
                // On error, try using our proxy
                (e.target as HTMLImageElement).src = `/api/proxy-image?url=${encodeURIComponent(design)}`;
                
                // Add a second error handler for the proxy attempt
                (e.target as HTMLImageElement).onerror = (e2) => {
                  console.error(`Error loading image ${index} through proxy:`, e2);
                  // If proxy also fails, use a known working fallback image
                  (e.target as HTMLImageElement).src = fallbackImage;
                };
              }}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(design)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
