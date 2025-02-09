import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import AreaSelector, { type Area } from "@/components/area-selector";
import FurnitureCollection, { type FurnitureItem } from "@/components/furniture-collection";
import ComparisonSlider from "@/components/comparison-slider";
import { useMutation } from "@tanstack/react-query";

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
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const { toast } = useToast();

  const detectObjectsMutation = useMutation({
    mutationFn: async (image: string) => {
      const response = await fetch("/api/detect-objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error("Failed to detect objects");
      }

      const data = await response.json();
      return data.objects;
    },
    onSuccess: (objects) => {
      setDetectedObjects(objects);
      // Filter for furniture items only
      const furnitureObjects = objects.filter(obj => 
        ['chair', 'couch', 'sofa', 'bed', 'table', 'desk', 'cabinet', 'dresser']
          .includes(obj.label.toLowerCase())
      );

      // Convert detected objects to areas
      const areas = furnitureObjects.map((obj, index) => ({
        id: `detected-${index}`,
        x: obj.box.x1,
        y: obj.box.y1,
        width: obj.box.x2 - obj.box.x1,
        height: obj.box.y2 - obj.box.y1,
        label: obj.label
      }));

      setSelectedAreas(areas);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to detect objects in the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const stagingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/virtual-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          areas: selectedAreas,
          furnitureId: selectedFurniture?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate staged design");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setStagedImage(data.originalImage);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate staged design. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (image: string) => {
    setUploadedImage(image);
    detectObjectsMutation.mutate(image);
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
        description: "Please select at least one area to replace",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFurniture) {
      toast({
        title: "Error",
        description: "Please select a furniture item",
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
            {detectObjectsMutation.isPending && (
              <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detecting furniture...
              </div>
            )}
          </Card>

          {uploadedImage && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">2. Select Areas to Replace</h2>
              <AreaSelector
                image={uploadedImage}
                onAreaSelect={setSelectedAreas}
              />
              {detectedObjects.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Detected furniture items: {detectedObjects.map(obj => obj.label).join(', ')}
                  </p>
                </div>
              )}
            </Card>
          )}

          {selectedAreas.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">3. Choose Furniture</h2>
              <FurnitureCollection
                onSelect={setSelectedFurniture}
                selectedItemId={selectedFurniture?.id}
              />
            </Card>
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
              <ComparisonSlider
                beforeImage={uploadedImage}
                afterImage={stagedImage}
                className="w-full"
              />
            ) : uploadedImage ? (
              <div className="relative w-full aspect-[4/3]">
                <img
                  src={uploadedImage}
                  alt="Original room"
                  className="w-full h-full object-cover rounded-lg"
                />
                {selectedFurniture && selectedAreas.map((area, index) => (
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
                      {selectedFurniture.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">
                  Upload an image to see preview
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}