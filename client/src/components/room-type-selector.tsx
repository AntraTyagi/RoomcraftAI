<<<<<<< HEAD
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
=======
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

interface RoomTypeSelectorProps {
  selected: string | null;
  onSelect: (room: string) => void;
}

const ROOM_TYPES = [
  {
    name: "Living Room",
    description: "Main living space for relaxation and entertainment",
  },
  {
    name: "Bedroom",
    description: "Personal space for rest and comfort",
  },
  {
    name: "Kitchen",
    description: "Functional space for cooking and dining",
  },
  {
    name: "Home Office",
    description: "Productive workspace at home",
  },
];

export default function RoomTypeSelector({ selected, onSelect }: RoomTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {ROOM_TYPES.map((room) => (
        <Card
          key={room.name}
          className={cn(
            "cursor-pointer p-4 transition-all hover:border-primary overflow-visible",
            selected === room.name && "ring-2 ring-primary"
          )}
          onClick={() => onSelect(room.name)}
        >
          <div className="relative w-full">
            <div className="relative">
              <h4 className="font-medium">{room.name}</h4>
              <p className="text-sm text-muted-foreground">{room.description}</p>
            </div>
            {selected === room.name && (
              <Badge 
                className="absolute -top-2 -right-2 z-[1]"
                variant="secondary"
              >
                Selected
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}