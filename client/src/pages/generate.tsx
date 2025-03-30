import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import StyleSelector from "@/components/style-selector";
import RoomTypeSelector from "@/components/room-type-selector";
import DesignGallery from "@/components/design-gallery";
import DebugPanel from "@/components/debug-panel";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { COLOR_THEMES } from "@/constants/color-themes";
import { Badge } from "@/components/ui/badge";

export default function Generate() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generatedDesigns, setGeneratedDesigns] = useState<string[]>([]);
  const [unstagedRoom, setUnstagedRoom] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, refreshCredits } = useAuth();

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please login to generate designs");
      }

      if (!uploadedImage || !selectedStyle || !selectedRoom || !selectedTheme) {
        throw new Error("Please fill in all required fields");
      }

      try {
        // Get the token from localStorage
        const token = localStorage.getItem('auth_token') || '';
        
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            image: uploadedImage.split(',')[1],
            style: selectedStyle,
            roomType: selectedRoom,
            colorTheme: selectedTheme,
            prompt: prompt || '',
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(errorText || "Failed to generate designs");
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Generate API error:", error);
        throw error instanceof Error ? error : new Error("An unknown error occurred");
      }
    },
    onSuccess: (data) => {
      console.log("Generation API response:", data);
      
      if (!data.designs || !Array.isArray(data.designs)) {
        console.error("Invalid data format received:", data);
        throw new Error("Invalid response format from server");
      }
      
      console.log("Setting generated designs:", data.designs);
      setGeneratedDesigns(data.designs);
      
      console.log("Setting unstaged room:", data.unstagedRoom);
      setUnstagedRoom(data.unstagedRoom); 
      
      refreshCredits();
      toast({
        title: "Success",
        description: "Designs generated successfully!",
      });
    },
    onError: (error: Error) => {
      console.error("Generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate designs. Please try again.",
        variant: "destructive",
      });
      refreshCredits();
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

    if (!selectedStyle) {
      toast({
        title: "Error",
        description: "Please select a style",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRoom) {
      toast({
        title: "Error",
        description: "Please select a room type",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTheme) {
      toast({
        title: "Error",
        description: "Please select a color theme",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Design Concepts</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">1. Upload Your Room</h2>
          <FileUpload onUpload={setUploadedImage} />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">2. Room Type</h2>
          <RoomTypeSelector
            selected={selectedRoom}
            onSelect={setSelectedRoom}
          />
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">3. Choose Style</h2>
        <StyleSelector onSelect={setSelectedStyle} selected={selectedStyle} />
      </Card>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Color Theme</h2>
        <div className="grid grid-cols-2 gap-4">
          {COLOR_THEMES.map((theme) => (
            <Card
              key={theme.name}
              className={cn(
                "cursor-pointer p-4 transition-all hover:border-primary relative",
                selectedTheme === theme.name && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedTheme(theme.name)}
            >
              <div className="flex flex-col h-full">
                <div
                  className="w-full h-16 rounded-md mb-3"
                  style={{ background: theme.preview }}
                />
                <div className="flex gap-2 mb-2 flex-wrap">
                  {Object.entries(theme.colors).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs capitalize text-muted-foreground">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
                <h4 className="font-medium">{theme.name}</h4>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
                {selectedTheme === theme.name && (
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    Selected
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">5. Additional Details (Optional)</h2>
        <Input
          placeholder="Add specific requirements or preferences..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mb-4"
        />
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !user}
          className="w-full"
        >
          {generateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Generate Designs
        </Button>
      </Card>

      {uploadedImage && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Debug Panel</h2>
          <DebugPanel
            inputImage={uploadedImage}
            visualizationImage={unstagedRoom}
            prompt="empty room, nothing"
          />
        </Card>
      )}

      {generatedDesigns.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Designs</h2>
          <DesignGallery designs={generatedDesigns} />
        </Card>
      )}
    </div>
  );
}