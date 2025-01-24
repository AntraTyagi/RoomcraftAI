import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import AreaSelector, { type Area } from "@/components/area-selector";
import FurnitureCollection from "@/components/furniture-collection";
import ComparisonSlider from "@/components/comparison-slider";
import { useMutation } from "@tanstack/react-query";

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
}

export default function VirtualStaging() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const { toast } = useToast();

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

      const data = await response.json();
      return data.stagedImage;
    },
    onSuccess: (stagedImage) => {
      setStagedImage(stagedImage);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate staged design. Please try again.",
        variant: "destructive",
      });
    },
  });

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
            <FileUpload onUpload={setUploadedImage} />
          </Card>

          {uploadedImage && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">2. Select Areas to Replace</h2>
              <AreaSelector
                image={uploadedImage}
                onAreaSelect={setSelectedAreas}
              />
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
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            {uploadedImage && stagedImage ? (
              <ComparisonSlider
                beforeImage={uploadedImage}
                afterImage={stagedImage}
                className="w-full"
              />
            ) : uploadedImage ? (
              <img
                src={uploadedImage}
                alt="Original room"
                className="w-full aspect-[4/3] object-cover rounded-lg"
              />
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