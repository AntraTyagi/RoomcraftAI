import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import ComparisonSlider from "@/components/comparison-slider";
import { useMutation } from "@tanstack/react-query";

const ROOM_TYPES = [
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Kitchen",
  "Office",
  "Bathroom",
];

const STYLE_OPTIONS = [
  "Modern Minimalist",
  "Contemporary",
  "Traditional",
  "Scandinavian",
  "Industrial",
  "Luxury",
];

export default function VirtualStaging() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const { toast } = useToast();

  const stagingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/virtual-staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          roomType: selectedRoom,
          style: selectedStyle,
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

    if (!selectedRoom || !selectedStyle) {
      toast({
        title: "Error",
        description: "Please select both room type and style",
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

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">2. Room Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {ROOM_TYPES.map((room) => (
                <Button
                  key={room}
                  variant={selectedRoom === room ? "default" : "outline"}
                  onClick={() => setSelectedRoom(room)}
                  className="justify-start"
                >
                  {room}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">3. Style Preference</h2>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((style) => (
                <Button
                  key={style}
                  variant={selectedStyle === style ? "default" : "outline"}
                  onClick={() => setSelectedStyle(style)}
                  className="justify-start"
                >
                  {style}
                </Button>
              ))}
            </div>
          </Card>

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
