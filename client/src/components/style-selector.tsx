import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StyleSelectorProps {
  selected: string | null;
  onSelect: (style: string) => void;
}

const STYLES = [
  {
    name: "Modern",
    image: "https://images.unsplash.com/photo-1600210491369-e753d80a41f3",
    description: "Clean lines, minimalist approach",
  },
  {
    name: "Bohemian",
    image: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da",
    description: "Eclectic, artistic, free-spirited",
  },
  {
    name: "Victorian",
    image: "https://images.unsplash.com/photo-1472228283686-42356d789f66",
    description: "Ornate, traditional, elegant",
  },
  {
    name: "Contemporary",
    image: "https://images.unsplash.com/photo-1611094016919-36b65678f3d6",
    description: "Current trends, sophisticated",
  },
];

export default function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {STYLES.map((style) => (
        <Card
          key={style.name}
          className={cn(
            "cursor-pointer overflow-hidden relative group transition-all",
            selected === style.name && "ring-2 ring-primary"
          )}
          onClick={() => onSelect(style.name)}
        >
          <div className="relative">
            <img
              src={style.image}
              alt={style.name}
              className="w-full h-32 object-cover"
            />
            {selected === style.name && (
              <Badge
                className="absolute top-2 right-2 bg-primary/90 text-primary-foreground"
                variant="secondary"
              >
                Selected
              </Badge>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-semibold">{style.name}</h3>
            <p className="text-sm text-muted-foreground">{style.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}