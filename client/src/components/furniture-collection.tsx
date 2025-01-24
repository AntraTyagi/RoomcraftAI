import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

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

// Sample furniture data
const FURNITURE_ITEMS: FurnitureItem[] = [
  {
    id: "1",
    name: "Modern Sofa",
    category: "Seating",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    description: "Contemporary minimalist sofa in gray",
    defaultPosition: [0, 0, 0],
    defaultRotation: [0, Math.PI / 4, 0],
  },
  {
    id: "2",
    name: "Accent Chair",
    category: "Seating",
    image: "https://images.unsplash.com/photo-1506439773649-6e31c1b75d1d",
    description: "Mid-century modern accent chair",
    defaultPosition: [0, 0, 0],
    defaultRotation: [0, -Math.PI / 4, 0],
  },
  {
    id: "3",
    name: "Coffee Table",
    category: "Tables",
    image: "https://images.unsplash.com/photo-1532372320978-9977d2ec5f30",
    description: "Glass and wood coffee table",
    defaultPosition: [0, -0.5, 0],
    defaultRotation: [0, 0, 0],
  },
];

export default function FurnitureCollection({ onSelect, selectedItemId }: FurnitureCollectionProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Furniture Collection</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-2 gap-4">
          {FURNITURE_ITEMS.map((item) => (
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
                <div className="absolute top-2 right-2 bg-primary/10 px-2 py-1 rounded-full">
                  <span className="text-xs font-medium">3D Preview</span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

export type { FurnitureItem };