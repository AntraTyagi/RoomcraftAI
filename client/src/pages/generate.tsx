import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import StyleSelector from "@/components/style-selector";
import RoomPreferences from "@/components/room-preferences";
import DesignGallery from "@/components/design-gallery";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function Generate() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generatedDesigns, setGeneratedDesigns] = useState<string[]>([]);
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

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          image: uploadedImage.split(',')[1],
          style: selectedStyle,
          roomType: selectedRoom,
          colorTheme: selectedTheme,
          prompt: prompt || undefined
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setGeneratedDesigns(data.designs);
      refreshCredits();
      toast({
        title: "Success",
        description: "Designs generated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate designs. Please try again.",
        variant: "destructive",
      });
      refreshCredits();
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Design Concepts</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">1. Upload Room Photo</h2>
          <FileUpload onUpload={setUploadedImage} />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">2. Room Type & Theme</h2>
          <RoomPreferences
            selectedRoom={selectedRoom}
            selectedTheme={selectedTheme}
            onRoomSelect={setSelectedRoom}
            onThemeSelect={setSelectedTheme}
          />
        </Card>
      </div>

      <Card className="p-6 my-8">
        <h2 className="text-xl font-semibold mb-4">3. Choose Style</h2>
        <StyleSelector onSelect={setSelectedStyle} selected={selectedStyle} />
      </Card>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Additional Details (Optional)</h2>
        <Input
          placeholder="Add specific requirements or preferences..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mb-4"
        />
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="w-full"
        >
          {generateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {generateMutation.isPending ? "Generating Designs..." : "Generate Designs"}
        </Button>
      </Card>

      {generatedDesigns.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Designs</h2>
          <DesignGallery designs={generatedDesigns} />
        </Card>
      )}
    </div>
  );
}