import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

const FURNITURE_CATEGORIES = [
  { id: "couch" as FurnitureType, label: "Couches" },
  { id: "bed" as FurnitureType, label: "Beds" },
  { id: "work_table" as FurnitureType, label: "Work Tables" },
  { id: "center_table" as FurnitureType, label: "Center Tables" },
];

export default function FurnitureCollection({ onSelect, selectedItemId }: FurnitureCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureType>("couch");

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Furniture Collection</h3>

      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FurnitureType)}>
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
        ))}
      </Tabs>
    </Card>
  );
}

export type { FurnitureItem };