import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoomPreferencesProps {
  selectedRoom: string | null;
  selectedTheme: string | null;
  onRoomSelect: (room: string) => void;
  onThemeSelect: (theme: string) => void;
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

const COLOR_THEMES = [
  {
    name: "Neutral & Earthy",
    description: "Beige, brown, and cream tones",
  },
  {
    name: "Cool & Calm",
    description: "Blues, grays, and soft whites",
  },
  {
    name: "Warm & Cozy",
    description: "Rich browns, warm grays, and terracotta",
  },
  {
    name: "Bold & Vibrant",
    description: "Striking colors with dramatic contrasts",
  },
];

export default function RoomPreferences({
  selectedRoom,
  selectedTheme,
  onRoomSelect,
  onThemeSelect,
}: RoomPreferencesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Room Type</h3>
        <div className="grid grid-cols-2 gap-4">
          {ROOM_TYPES.map((room) => (
            <Card
              key={room.name}
              className={cn(
                "cursor-pointer p-4 transition-all hover:border-primary",
                selectedRoom === room.name && "ring-2 ring-primary"
              )}
              onClick={() => onRoomSelect(room.name)}
            >
              <h4 className="font-medium">{room.name}</h4>
              <p className="text-sm text-muted-foreground">{room.description}</p>
              {selectedRoom === room.name && (
                <Badge className="absolute top-2 right-2" variant="secondary">
                  Selected
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Color Theme</h3>
        <div className="grid grid-cols-2 gap-4">
          {COLOR_THEMES.map((theme) => (
            <Card
              key={theme.name}
              className={cn(
                "cursor-pointer p-4 transition-all hover:border-primary",
                selectedTheme === theme.name && "ring-2 ring-primary"
              )}
              onClick={() => onThemeSelect(theme.name)}
            >
              <h4 className="font-medium">{theme.name}</h4>
              <p className="text-sm text-muted-foreground">{theme.description}</p>
              {selectedTheme === theme.name && (
                <Badge className="absolute top-2 right-2" variant="secondary">
                  Selected
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
