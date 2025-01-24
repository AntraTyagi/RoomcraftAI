import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
}

interface FurnitureCollectionProps {
  onSelect: (item: FurnitureItem) => void;
  selectedItemId?: string;
}

// Sample furniture data - In a real app, this would come from an API
const FURNITURE_ITEMS: FurnitureItem[] = [
  {
    id: "1",
    name: "Modern Sofa",
    category: "Seating",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    description: "Contemporary minimalist sofa in gray",
  },
  {
    id: "2",
    name: "Accent Chair",
    category: "Seating",
    image: "https://images.unsplash.com/photo-1506439773649-6e31c1b75d1d",
    description: "Mid-century modern accent chair",
  },
  {
    id: "3",
    name: "Coffee Table",
    category: "Tables",
    image: "https://images.unsplash.com/photo-1532372320978-9977d2ec5f30",
    description: "Glass and wood coffee table",
  },
  // Add more furniture items as needed
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
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-32 object-cover"
              />
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
