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
      if (!selectedAreas.length || !selectedFurniture || !uploadedImage) {
        throw new Error("Missing required data for staging");
      }

      // Create a canvas to generate the mask
      const canvas = document.createElement('canvas');
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = uploadedImage;
      });

      // Set canvas size to match original image
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Failed to get canvas context");

      // Fill the mask with black (transparent)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fill the selected areas with white (areas to inpaint)
      ctx.fillStyle = 'white';
      selectedAreas.forEach(area => {
        // Calculate the actual dimensions relative to the original image
        const containerWidth = document.getElementById('comparison-slider')?.clientWidth || canvas.width;
        const containerHeight = document.getElementById('comparison-slider')?.clientHeight || canvas.height;

        const x = (area.x / containerWidth) * canvas.width;
        const y = (area.y / containerHeight) * canvas.height;
        const width = (area.width / containerWidth) * canvas.width;
        const height = (area.height / containerHeight) * canvas.height;

        ctx.fillRect(x, y, width, height);

        // Log mask coordinates for debugging
        console.log("Generated mask area:", { x, y, width, height,
          containerWidth, containerHeight,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height });
      });

      // Convert mask to base64
      const maskBase64 = canvas.toDataURL('image/png').split(',')[1];

      // For debugging - save input image
      const debugInputCanvas = document.createElement('canvas');
      debugInputCanvas.width = img.width;
      debugInputCanvas.height = img.height;
      const debugInputCtx = debugInputCanvas.getContext('2d');
      if (debugInputCtx) {
        debugInputCtx.drawImage(img, 0, 0);
        console.log("Input image (PNG):", debugInputCanvas.toDataURL('image/png'));
      }

      // For debugging - save mask image
      const debugMaskCanvas = document.createElement('canvas');
      debugMaskCanvas.width = img.width;
      debugMaskCanvas.height = img.height;
      const debugMaskCtx = debugMaskCanvas.getContext('2d');
      if (debugMaskCtx) {
        // Fill the mask with black (transparent)
        debugMaskCtx.fillStyle = 'black';
        debugMaskCtx.fillRect(0, 0, debugMaskCanvas.width, debugMaskCanvas.height);

        // Fill the selected areas with white (areas to inpaint)
        debugMaskCtx.fillStyle = 'white';
        selectedAreas.forEach(area => {
          const containerWidth = document.getElementById('comparison-slider')?.clientWidth || canvas.width;
          const containerHeight = document.getElementById('comparison-slider')?.clientHeight || canvas.height;
          const x = (area.x / containerWidth) * canvas.width;
          const y = (area.y / containerHeight) * canvas.height;
          const width = (area.width / containerWidth) * canvas.width;
          const height = (area.height / containerHeight) * canvas.height;
          debugMaskCtx.fillRect(x, y, width, height);
        });
        console.log("Mask image (PNG):", debugMaskCanvas.toDataURL('image/png'));
      }

      // Create a combined debug visualization
      const debugVisCanvas = document.createElement('canvas');
      debugVisCanvas.width = img.width;
      debugVisCanvas.height = img.height;
      const debugVisCtx = debugVisCanvas.getContext('2d');
      if (debugVisCtx) {
        // Draw original image
        debugVisCtx.drawImage(img, 0, 0);
        // Draw mask with semi-transparency
        debugVisCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        selectedAreas.forEach(area => {
          const containerWidth = document.getElementById('comparison-slider')?.clientWidth || canvas.width;
          const containerHeight = document.getElementById('comparison-slider')?.clientHeight || canvas.height;
          const x = (area.x / containerWidth) * canvas.width;
          const y = (area.y / containerHeight) * canvas.height;
          const width = (area.width / containerWidth) * canvas.width;
          const height = (area.height / containerHeight) * canvas.height;
          debugVisCtx.fillRect(x, y, width, height);
        });
        console.log("Debug visualization (PNG):", debugVisCanvas.toDataURL('image/png'));
      }

      // Generate a detailed prompt based on the selected furniture
      const prompt = `Replace the masked area with ${selectedFurniture.name.toLowerCase()}, ${selectedFurniture.description}, 
        high-quality interior design photography, detailed materials and textures, 8k resolution, professional interior photograph, 
        perfect lighting, ultra realistic`;

      console.log("Sending inpainting request:", {
        maskSize: maskBase64.length,
        prompt,
        imageSize: uploadedImage.length,
        selectedAreas: selectedAreas.length
      });


      // Call the inpainting endpoint
      const response = await fetch("/api/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage.split(',')[1], // Remove data URL prefix if present
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
        description: "Furniture replacement completed successfully",
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
                id="comparison-slider"
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