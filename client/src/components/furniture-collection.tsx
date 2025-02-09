import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  defaultPosition?: [number, number, number];
  defaultRotation?: [number, number, number];
}

interface FurnitureCollectionProps {
  onSelect: (item: FurnitureItem) => void;
  selectedItemId?: string;
}

async function generateFurnitureImage(type: string, index: number): Promise<string> {
  const response = await fetch("/api/generate-furniture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, index }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate furniture image");
  }

  const data = await response.json();
  return data.imageUrl;
}

const FURNITURE_CATEGORIES = [
  { id: "couch", label: "Couches" },
  { id: "bed", label: "Beds" },
  { id: "work_table", label: "Work Tables" },
  { id: "center_table", label: "Center Tables" },
];

export default function FurnitureCollection({ onSelect, selectedItemId }: FurnitureCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("couch");
  const [generatedItems, setGeneratedItems] = useState<FurnitureItem[]>([]);

  useEffect(() => {
    // Generate initial items for the first category
    Promise.all(
      Array(5).fill(null).map(async (_, index) => {
        const imageUrl = await generateFurnitureImage(selectedCategory, index);
        return {
          id: `${selectedCategory}-${index}`,
          name: `${FURNITURE_CATEGORIES.find(cat => cat.id === selectedCategory)?.label} ${index + 1}`,
          category: selectedCategory,
          image: imageUrl,
          description: `${selectedCategory} style furniture piece`,
        };
      })
    ).then(setGeneratedItems);
  }, [selectedCategory]);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Furniture Collection</h3>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-4">
          {FURNITURE_CATEGORIES.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FURNITURE_CATEGORIES.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-4">
                {generatedItems.length === 0 ? (
                  <div className="col-span-2 flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  generatedItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary ${
                        selectedItemId === item.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => onSelect(item)}
                    >
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}

export type { FurnitureItem };