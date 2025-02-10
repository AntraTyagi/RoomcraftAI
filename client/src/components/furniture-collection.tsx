import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FURNITURE_REPOSITORY, type FurnitureType } from "@/constants/furniture-repository";

interface FurnitureItem {
  id: string;
  name: string;
  image: string;
  description: string;
  defaultPosition?: [number, number, number];
  defaultRotation?: [number, number, number];
}

interface FurnitureCollectionProps {
  onSelect: (item: FurnitureItem) => void;
  selectedItemId?: string;
  detectedObjects?: Array<{
    label: string;
    confidence: number;
    box: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  }>;
}

const FURNITURE_CATEGORIES = [
  { id: "couch" as FurnitureType, label: "Couches" },
  { id: "bed" as FurnitureType, label: "Beds" },
  { id: "work_table" as FurnitureType, label: "Work Tables" },
  { id: "center_table" as FurnitureType, label: "Center Tables" },
];

export default function FurnitureCollection({ onSelect, selectedItemId, detectedObjects = [] }: FurnitureCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureType>("couch");

  // Helper function to check if a furniture type matches detected objects
  const getMatchingObjects = (category: string) => {
    return detectedObjects.filter(obj => {
      const label = obj.label.toLowerCase();
      switch (category) {
        case 'couch':
          return label.includes('sofa') || label.includes('couch');
        case 'bed':
          return label.includes('bed');
        case 'work_table':
          return label.includes('desk') || label.includes('work table');
        case 'center_table':
          return label.includes('coffee table') || label.includes('center table');
        default:
          return false;
      }
    });
  };

  return (
    <Card className="p-4">
      <h3 className="text-xl font-semibold mb-4">Furniture Collection</h3>

      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FurnitureType)}>
        <TabsList className="mb-4">
          {FURNITURE_CATEGORIES.map(category => {
            const matchingCount = getMatchingObjects(category.id).length;
            return (
              <TabsTrigger key={category.id} value={category.id} className="relative">
                {category.label}
                {matchingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {matchingCount}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {FURNITURE_CATEGORIES.map(category => {
          const matchingObjects = getMatchingObjects(category.id);
          return (
            <TabsContent key={category.id} value={category.id}>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-2 gap-4">
                  {FURNITURE_REPOSITORY[category.id].map((item) => (
                    <Card
                      key={item.id}
                      className={`cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary ${
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
                        {matchingObjects.length > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="absolute top-2 right-2"
                          >
                            Detected in Room
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>
    </Card>
  );
}

export type { FurnitureItem };