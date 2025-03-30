import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import AreaSelector, { type Area } from "@/components/area-selector";
import FurnitureOperation from "@/components/furniture-operation";
import ComparisonSlider from "@/components/comparison-slider";
import DebugPanel from "@/components/debug-panel";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

// Furniture type options with images
const FURNITURE_TYPES = [
  {
    value: "sofa",
    label: "Sofa",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80"
  },
  {
    value: "chair",
    label: "Chair",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80"
  },
  {
    value: "table",
    label: "Table",
    image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500&q=80"
  },
  {
    value: "bed",
    label: "Bed",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&q=80"
  },
  {
    value: "cabinet",
    label: "Cabinet",
    image: "https://images.unsplash.com/photo-1493957988430-a5f2e15f39a3?w=500&q=80"
  },
  {
    value: "desk",
    label: "Desk",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&q=80"
  }
];

// Style options with images
const STYLE_OPTIONS = [
  {
    value: "modern",
    label: "Modern",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=500&q=80",
    description: "Clean lines, minimalist approach"
  },
  {
    value: "bohemian",
    label: "Bohemian",
    image: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=500&q=80",
    description: "Eclectic, artistic, free-spirited"
  },
  {
    value: "victorian",
    label: "Victorian",
    image: "https://images.unsplash.com/photo-1472228283686-42356d789f66?w=500&q=80",
    description: "Ornate, traditional, elegant"
  },
  {
    value: "contemporary",
    label: "Contemporary",
    image: "https://images.unsplash.com/photo-1611094016919-36b65678f3d6?w=500&q=80",
    description: "Current trends, sophisticated"
  }
];

// Color options with hex values for swatches
const COLOR_OPTIONS = [
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "cream", label: "Cream", hex: "#FDFBF3" },
  { value: "beige", label: "Beige", hex: "#F5F5DC" },
  { value: "lightGray", label: "Light Gray", hex: "#D3D3D3" },
  { value: "gray", label: "Gray", hex: "#808080" },
  { value: "charcoal", label: "Charcoal", hex: "#36454F" },
  { value: "black", label: "Black", hex: "#000000" },
  { value: "navy", label: "Navy", hex: "#000080" },
  { value: "lightBlue", label: "Light Blue", hex: "#ADD8E6" },
  { value: "teal", label: "Teal", hex: "#008080" },
  { value: "sage", label: "Sage", hex: "#BCB88A" },
  { value: "forestGreen", label: "Forest Green", hex: "#228B22" },
  { value: "olive", label: "Olive", hex: "#808000" },
  { value: "brown", label: "Brown", hex: "#8B4513" },
  { value: "burgundy", label: "Burgundy", hex: "#800020" },
  { value: "rust", label: "Rust", hex: "#B7410E" },
  { value: "terracotta", label: "Terracotta", hex: "#E2725B" },
  { value: "natural", label: "Natural Wood", hex: "#DEB887" }
];

export default function VirtualStaging() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [operation, setOperation] = useState<"replace" | "remove" | undefined>();
  const [furnitureType, setFurnitureType] = useState<string | undefined>();
  const [furnitureStyle, setFurnitureStyle] = useState<string | undefined>();
  const [furnitureColor, setFurnitureColor] = useState<string | undefined>();
  const [maskVisualization, setMaskVisualization] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, refreshCredits } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const stagingMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please login to use virtual staging");
      }
      if (!selectedAreas.length || !operation || !uploadedImage) {
        throw new Error("Missing required data for staging");
      }

      console.log("=== VIRTUAL STAGING PROCESS STARTED ===");
      console.log(`Operation: ${operation}, Areas selected: ${selectedAreas.length}`);
      if (operation === "replace") {
        console.log(`Furniture type: ${furnitureType || 'Not specified'}`);
        console.log(`Furniture style: ${furnitureStyle || 'Not specified'}`);
        console.log(`Furniture color: ${furnitureColor || 'Not specified'}`);
      }
      
      // Validate mask visualization and prompt
      if (!maskVisualization) {
        console.error("No mask visualization generated");
        throw new Error("Failed to generate mask image");
      }
      
      if (!currentPrompt) {
        console.error("No prompt generated for the selected operation");
        throw new Error("Failed to generate prompt for staging");
      }
      
      console.log("Current prompt:", currentPrompt);
      
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('auth_token') || '';
        console.log("Auth token available:", !!token);
        
        // Validate the image format before sending
        let imageData = "";
        if (uploadedImage.startsWith('data:image')) {
          // Extract base64 part from data URL
          const parts = uploadedImage.split(',');
          if (parts.length === 2) {
            imageData = parts[1];
          } else {
            console.error("Invalid image data URL format");
            throw new Error("Invalid image format");
          }
        } else {
          console.error("Image is not in expected data URL format");
          imageData = uploadedImage; // Try to use as is
        }
        
        console.log("Preparing to send request to server");
        console.log("Image data length:", imageData.length);
        console.log("Mask data length:", maskVisualization.length);
        console.log("Prompt length:", currentPrompt.length);
        
        const response = await fetch("/api/inpaint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            image: imageData,
            mask: maskVisualization,
            prompt: currentPrompt,
          }),
        });

        console.log("Server response status:", response.status);
        
        if (!response.ok) {
          let errorMessage = "";
          try {
            const errorText = await response.text();
            console.error("API error response:", errorText);
            try {
              // Try to parse as JSON
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorText;
            } catch (e) {
              // Not JSON, use as is
              errorMessage = errorText;
            }
          } catch (e) {
            errorMessage = `Server returned status ${response.status}`;
          }
          
          throw new Error(errorMessage || "Failed to stage image");
        }

        const data = await response.json();
        console.log("Server response received successfully");
        return data;
      } catch (error: any) {
        console.error("=== STAGING API ERROR ===");
        console.error("Error details:", error.message || "Unknown error");
        console.error("Error stack:", error.stack);
        throw error instanceof Error ? error : new Error("An unknown error occurred");
      }
    },
    onSuccess: (data) => {
      console.log("=== STAGING COMPLETED SUCCESSFULLY ===");
      console.log("Staging API response:", data);
      
      if (!data.inpaintedImage) {
        console.error("Invalid data format received:", data);
        toast({
          title: "Error",
          description: "Server returned an invalid response format. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Setting staged image, URL starts with:", 
        data.inpaintedImage.substring(0, 30) + "...");
      setStagedImage(data.inpaintedImage);
      
      // Refresh user credits
      console.log("Refreshing user credits");
      refreshCredits();
      
      toast({
        title: "Success!",
        description: `Furniture ${operation === "remove" ? "removal" : "replacement"} completed successfully! 🎉`,
      });
    },
    onError: (error: Error) => {
      console.error("=== STAGING FAILED ===");
      console.error("Error details:", error.message || "Unknown error");
      
      // Check for specific error types and provide helpful messages
      let errorMessage = error.message || "Failed to modify the image. Please try again.";
      
      if (errorMessage.includes("Insufficient credits")) {
        errorMessage = "You don't have enough credits to perform this operation. Please add more credits to continue.";
      } else if (errorMessage.includes("API key")) {
        errorMessage = "There was an issue with the AI service. Please try again later.";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        errorMessage = "The operation took too long to complete. Please try with a smaller area or try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (image: string) => {
    setUploadedImage(image);
    setSelectedAreas([]);
    setStagedImage(null);
  };

  const generateMaskVisualization = () => {
    if (!containerRef.current || !selectedAreas.length) return null;

    const canvas = document.createElement('canvas');
    const containerRect = containerRef.current.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    selectedAreas.forEach(area => {
      ctx.fillRect(area.x, area.y, area.width, area.height);
    });

    return canvas.toDataURL('image/png');
  };

  const generatePrompt = () => {
    if (!operation) return null;

    if (operation === "remove") {
      return `Remove the furniture in the masked area completely. 
        Fill the space naturally with flooring, walls, or appropriate background elements that match the room's style.
        Ensure seamless integration with the surrounding area.`;
    } else if (operation === "replace" && furnitureType && furnitureStyle) {
      return `Replace the masked area with a ${furnitureColor || ''} ${furnitureStyle} style ${furnitureType}. 
        The furniture style should be ${furnitureStyle} with high-end materials and craftsmanship.
        Maintain the exact same position, scale, and perspective as the furniture in the original image.`;
    }
    return null;
  };

  useEffect(() => {
    if (selectedAreas.length && operation) {
      const maskImage = generateMaskVisualization();
      setMaskVisualization(maskImage);
      const prompt = generatePrompt();
      setCurrentPrompt(prompt);
    } else {
      setMaskVisualization(null);
      setCurrentPrompt(null);
    }
  }, [selectedAreas, operation, furnitureType, furnitureStyle, furnitureColor]);


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
              <div ref={containerRef}>
                <AreaSelector
                  image={uploadedImage}
                  onAreaSelect={setSelectedAreas}
                  selectedAreas={selectedAreas}
                />
              </div>
            </Card>
          )}

          {selectedAreas.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">3. Choose Operation</h2>
              <FurnitureOperation
                onOperationSelect={setOperation}
                onFurnitureTypeSelect={setFurnitureType}
                onStyleSelect={setFurnitureStyle}
                onColorSelect={setFurnitureColor}
                selectedOperation={operation}
                selectedFurnitureType={furnitureType}
                selectedStyle={furnitureStyle}
                selectedColor={furnitureColor}
                furnitureTypes={FURNITURE_TYPES}
                styleOptions={STYLE_OPTIONS}
                colorOptions={COLOR_OPTIONS}
              />
            </Card>
          )}

          {selectedAreas.length > 0 && operation && (
            <DebugPanel
              inputImage={uploadedImage}
              maskImage={maskVisualization}
              prompt={currentPrompt}
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
              <div className="relative w-full aspect-[4/3]">
                <ComparisonSlider
                  beforeImage={uploadedImage}
                  afterImage={stagedImage}
                  className="w-full"
                />
              </div>
            ) : uploadedImage ? (
              <div className="relative w-full aspect-[4/3]">
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