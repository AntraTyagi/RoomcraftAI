import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DesignGalleryProps {
  designs: string[];
}

export default function DesignGallery({ designs }: DesignGalleryProps) {
  const getProxiedImageUrl = (originalUrl: string) => {
    return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  };

  const handleDownload = (url: string) => {
    // For download, use the proxied URL
    const proxiedUrl = getProxiedImageUrl(url);
    
    fetch(proxiedUrl)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `design-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      })
      .catch(error => {
        console.error("Error downloading image:", error);
      });
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
        const proxiedUrl = getProxiedImageUrl(design);
        console.log(`Using proxied URL for design ${index}:`, proxiedUrl);
        
        return (
          <Card key={index} className="overflow-hidden group relative">
            <img
              src={proxiedUrl}
              alt={`Generated design ${index + 1}`}
              className="w-full h-64 object-cover"
              onError={(e) => {
                console.error(`Error loading image ${index}:`, e);
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjOTk5OTk5Ij5JbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg==';
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
