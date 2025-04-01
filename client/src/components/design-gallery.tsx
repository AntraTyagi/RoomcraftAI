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
        
        // Use proxy URL by default for Replicate images
        const imageUrl = design.includes('replicate.delivery') 
          ? `/api/proxy-image?url=${encodeURIComponent(design)}`
          : design;
        
        return (
          <Card key={index} className="overflow-hidden group relative">
            <img
              src={imageUrl}
              alt={`Generated design ${index + 1}`}
              className="w-full h-64 object-cover"
              onError={(e) => {
                console.error(`Error loading image ${index} via proxy:`, e);
                // If proxy fails, try the direct URL as fallback
                if (design.includes('replicate.delivery')) {
                  console.log(`Trying direct URL for image ${index}`);
                  (e.target as HTMLImageElement).src = design;
                }
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
