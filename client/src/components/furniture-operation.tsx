import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Replace } from "lucide-react";
import { cn } from "@/lib/utils";
import { FURNITURE_TYPES, FURNITURE_STYLES, FURNITURE_COLORS } from "@/constants/furniture-options";

interface Option {
  value: string;
  label: string;
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
  const adaptedFurnitureTypes = FURNITURE_TYPES.map(item => ({value: item.name, label: item.label}))
  const adaptedStyleOptions = FURNITURE_STYLES.map(item => ({value: item.name, label: item.label}))
  const adaptedColorOptions = FURNITURE_COLORS.map(item => ({value: item.name, label: item.label}))

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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {adaptedFurnitureTypes.map((type) => (
                <Card
                  key={type.value}
                  className={cn(
                    "cursor-pointer p-3 transition-all hover:border-primary",
                    selectedFurnitureType === type.value && "ring-2 ring-primary"
                  )}
                  onClick={() => onFurnitureTypeSelect(type.value)}
                >
                  <div className="text-center">
                    <h4 className="font-medium">{type.label}</h4>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {adaptedStyleOptions.map((style) => (
                <Card
                  key={style.value}
                  className={cn(
                    "cursor-pointer p-3 transition-all hover:border-primary",
                    selectedStyle === style.value && "ring-2 ring-primary"
                  )}
                  onClick={() => onStyleSelect(style.value)}
                >
                  <div className="text-center">
                    <h4 className="font-medium">{style.label}</h4>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {adaptedColorOptions.map((color) => (
                <Card
                  key={color.value}
                  className={cn(
                    "cursor-pointer p-3 transition-all hover:border-primary",
                    selectedColor === color.value && "ring-2 ring-primary"
                  )}
                  onClick={() => onColorSelect(color.value)}
                >
                  <div className="text-center">
                    <h4 className="font-medium">{color.label}</h4>
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