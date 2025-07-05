import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";

interface DesignGalleryProps {
  designs: string[];
}

export default function DesignGallery({ designs }: DesignGalleryProps) {
  const handleDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `design-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {designs.map((design, index) => (
        <Card key={index} className="overflow-hidden group relative">
          <img
            src={design}
            alt={`Generated design ${index + 1}`}
            className="w-full h-64 object-cover"
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
      ))}
    </div>
  );
}
