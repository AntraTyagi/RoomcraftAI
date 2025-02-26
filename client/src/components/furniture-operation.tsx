import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Replace } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  image?: string;
  hex?: string;
  description?: string;
}

interface FurnitureOperationProps {
  onOperationSelect: (operation: "replace" | "remove") => void;
  onFurnitureTypeSelect: (type: string) => void;
  onStyleSelect: (style: string) => void;
  onColorSelect: (color: string) => void;
  selectedOperation?: "replace" | "remove";
  selectedFurnitureType?: string;
  selectedStyle?: string;
  selectedColor?: string;
  furnitureTypes: Option[];
  styleOptions: Option[];
  colorOptions: Option[];
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
  furnitureTypes,
  styleOptions,
  colorOptions,
}: FurnitureOperationProps) {
  return (
    <div className="space-y-6">
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
            <label className="text-sm font-medium mb-2 block">
              Furniture Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {furnitureTypes.map((type) => (
                <Card
                  key={type.value}
                  className={cn(
                    "cursor-pointer overflow-hidden transition-all hover:border-primary",
                    selectedFurnitureType === type.value && "ring-2 ring-primary"
                  )}
                  onClick={() => onFurnitureTypeSelect(type.value)}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={type.image}
                      alt={type.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-center">{type.label}</h4>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Style
            </label>
            <div className="grid grid-cols-2 gap-4">
              {styleOptions.map((style) => (
                <Card
                  key={style.value}
                  className={cn(
                    "cursor-pointer overflow-hidden transition-all hover:border-primary",
                    selectedStyle === style.value && "ring-2 ring-primary"
                  )}
                  onClick={() => onStyleSelect(style.value)}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={style.image}
                      alt={style.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium">{style.label}</h4>
                    <p className="text-sm text-muted-foreground">{style.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Color
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {colorOptions.map((color) => (
                <Card
                  key={color.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    selectedColor === color.value && "ring-2 ring-primary"
                  )}
                  onClick={() => onColorSelect(color.value)}
                >
                  <div className="p-2">
                    <div
                      className="w-full aspect-square rounded-full border border-border mb-2"
                      style={{ backgroundColor: color.hex }}
                    />
                    <p className="text-xs text-center">{color.label}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { FurnitureOperationProps };