import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import AreaSelector, { type Area } from "@/components/area-selector";
import FurnitureOperation from "@/components/furniture-operation";
import ComparisonSlider from "@/components/comparison-slider";
import { useMutation } from "@tanstack/react-query";
import DebugPanel from "@/components/debug-panel";

const DEFAULT_FURNITURE_QUERY = "furniture, couch, sofa, bed, table, desk, cabinet, dresser, indoor plants, potted plants, wall art, paintings, artwork, curtains, window treatments, bookshelf, shelving unit, ottoman, footstool";

interface DetectedObject {
  label: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export default function VirtualStaging() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [operation, setOperation] = useState<"replace" | "remove" | undefined>();
  const [furnitureType, setFurnitureType] = useState<string | undefined>();
  const [furnitureStyle, setFurnitureStyle] = useState<string | undefined>();
  const [furnitureColor, setFurnitureColor] = useState<string | undefined>();
  const [debugImages, setDebugImages] = useState<{
    input?: string;
    mask?: string;
    visualization?: string;
    prompt?: string;
  }>({});
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const stagingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAreas.length || !operation || !uploadedImage) {
        throw new Error("Missing required data for staging");
      }

      const canvas = document.createElement('canvas');
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = uploadedImage;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Failed to get canvas context");

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect || containerRect.width === 0) {
        toast({
          title: "Error",
          description: "Could not determine image dimensions. Please try again.",
          variant: "destructive",
        });
        throw new Error("Invalid container dimensions");
      }

      ctx.fillStyle = 'white';
      selectedAreas.forEach(area => {
        const scaleX = img.width / containerRect.width;
        const scaleY = img.height / containerRect.height;

        const x = area.x * scaleX;
        const y = area.y * scaleY;
        const width = area.width * scaleX;
        const height = area.height * scaleY;

        ctx.fillRect(x, y, width, height);
      });

      const maskBase64 = canvas.toDataURL('image/png').split(',')[1];

      let prompt = '';
      if (operation === "remove") {
        prompt = `Remove the furniture in the masked area completely. 
          Fill the space naturally with flooring, walls, or appropriate background elements that match the room's style.
          Ensure seamless integration with the surrounding area.`;
      } else if (operation === "replace" && furnitureType && furnitureStyle) {
        prompt = `Replace the masked area with a ${furnitureColor || ''} ${furnitureStyle} style ${furnitureType}. 
          The furniture style should be ${furnitureStyle} with high-end materials and craftsmanship.
          Maintain the exact same position, scale, and perspective as the furniture in the original image.`;
      }

      setDebugImages(prev => ({ ...prev, prompt }));

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/inpaint", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          image: uploadedImage.split(',')[1],
          mask: maskBase64,
          prompt,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();

      if (!data.inpaintedImage) {
        throw new Error("No inpainted image received from the server");
      }

      return data;
    },
    onSuccess: (data) => {
      setStagedImage(data.inpaintedImage);
      toast({
        title: "Success",
        description: `Furniture ${operation === "remove" ? "removal" : "replacement"} completed successfully`,
      });
    },
    onError: (error: Error) => {
      console.error("Staging error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate staged design. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (image: string) => {
    setUploadedImage(image);
  };

  const handleGenerate = () => {
    if (!uploadedImage) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (selectedAreas.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one area to modify",
        variant: "destructive",
      });
      return;
    }

    if (!operation) {
      toast({
        title: "Error",
        description: "Please select an operation (replace or remove)",
        variant: "destructive",
      });
      return;
    }

    if (operation === "replace" && (!furnitureType || !furnitureStyle)) {
      toast({
        title: "Error",
        description: "Please select both furniture type and style",
        variant: "destructive",
      });
      return;
    }

    stagingMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Virtual Staging</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">1. Upload Room Photo</h2>
            <FileUpload onUpload={handleImageUpload} />
          </Card>

          {uploadedImage && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">2. Select Area to Modify</h2>
              <AreaSelector
                image={uploadedImage}
                onAreaSelect={setSelectedAreas}
              />
            </Card>
          )}

          {selectedAreas.length > 0 && (
            <FurnitureOperation
              onOperationSelect={setOperation}
              onFurnitureTypeSelect={setFurnitureType}
              onStyleSelect={setFurnitureStyle}
              onColorSelect={setFurnitureColor}
              selectedOperation={operation}
              selectedFurnitureType={furnitureType}
              selectedStyle={furnitureStyle}
              selectedColor={furnitureColor}
            />
          )}

          <Button
            onClick={handleGenerate}
            disabled={stagingMutation.isPending}
            className="w-full"
          >
            {stagingMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate Staged Design
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Room Preview</h2>
            {uploadedImage && stagedImage ? (
              <div ref={containerRef} id="comparison-slider">
                <ComparisonSlider
                  beforeImage={uploadedImage}
                  afterImage={stagedImage}
                  className="w-full"
                />
              </div>
            ) : uploadedImage ? (
              <div ref={containerRef} id="comparison-slider" className="relative w-full aspect-[4/3]">
                <img
                  src={uploadedImage}
                  alt="Original room"
                  className="w-full h-full object-cover rounded-lg"
                />
                {operation && selectedAreas.map((area, index) => (
                  <div
                    key={index}
                    className="absolute bg-primary/20 border-2 border-primary"
                    style={{
                      top: `${area.y}px`,
                      left: `${area.x}px`,
                      width: `${area.width}px`,
                      height: `${area.height}px`,
                    }}
                  >
                    <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                      {operation === "remove" ? "Remove" : `Replace with ${furnitureType}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div ref={containerRef} id="comparison-slider" className="w-full aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">
                  Upload an image to see preview
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
      <DebugPanel
        inputImage={debugImages.input}
        maskImage={debugImages.mask}
        visualizationImage={debugImages.visualization}
        prompt={debugImages.prompt}
      />
    </div>
  );
}