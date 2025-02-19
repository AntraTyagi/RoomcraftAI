import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Replace } from "lucide-react";
import { FURNITURE_TYPES, FURNITURE_STYLES, FURNITURE_COLORS } from "@/constants/furniture-options";

interface FurnitureOperationProps {
  onOperationSelect: (operation: "replace" | "remove") => void;
  onFurnitureTypeSelect: (type: string) => void;
  onStyleSelect: (style: string) => void;
  onColorSelect: (color: string) => void;
  selectedOperation?: "replace" | "remove";
  selectedFurnitureType?: string;
  selectedStyle?: string;
  selectedColor?: string;
}

export default function FurnitureOperation({
  onOperationSelect,
  onFurnitureTypeSelect,
  onStyleSelect,
  onColorSelect,
  selectedOperation,
  selectedFurnitureType,
  selectedStyle,
  selectedColor,
}: FurnitureOperationProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">Choose Operation</h3>

      <div className="flex gap-4 mb-6">
        <Button
          variant={selectedOperation === "replace" ? "default" : "outline"}
          className="flex-1"
          onClick={() => onOperationSelect("replace")}
        >
          <Replace className="mr-2 h-4 w-4" />
          Replace Furniture
        </Button>
        <Button
          variant={selectedOperation === "remove" ? "default" : "outline"}
          className="flex-1"
          onClick={() => onOperationSelect("remove")}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Furniture
        </Button>
      </div>

      {selectedOperation === "replace" && (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-4 block">
              Furniture Type
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {FURNITURE_TYPES.map((type) => (
                <Card
                  key={type.name}
                  className={`cursor-pointer p-4 transition-all hover:border-primary relative ${
                    selectedFurnitureType === type.name ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => onFurnitureTypeSelect(type.name)}
                >
                  <div className="aspect-video mb-3 rounded-md overflow-hidden">
                    <img
                      src={type.image}
                      alt={type.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-medium">{type.label}</h4>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-4 block">
              Style
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {FURNITURE_STYLES.map((style) => (
                <Card
                  key={style.name}
                  className={`cursor-pointer p-4 transition-all hover:border-primary relative ${
                    selectedStyle === style.name ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => onStyleSelect(style.name)}
                >
                  <div className="aspect-video mb-3 rounded-md overflow-hidden">
                    <img
                      src={style.image}
                      alt={style.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-medium">{style.label}</h4>
                  <p className="text-sm text-muted-foreground">{style.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-4 block">
              Color
            </label>
            <div className="grid grid-cols-3 gap-4">
              {FURNITURE_COLORS.map((color) => (
                <Card
                  key={color.name}
                  className={`cursor-pointer p-4 transition-all hover:border-primary relative ${
                    selectedColor === color.name ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => onColorSelect(color.name)}
                >
                  <div
                    className="w-full h-12 rounded-md mb-2"
                    style={{ backgroundColor: color.hex }}
                  />
                  <h4 className="font-medium">{color.label}</h4>
                  <p className="text-xs text-muted-foreground">{color.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export type { FurnitureOperationProps };