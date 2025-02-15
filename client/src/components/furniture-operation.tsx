import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Replace } from "lucide-react";

const FURNITURE_TYPES = [
  { value: "sofa", label: "Sofa" },
  { value: "bed", label: "Bed" },
  { value: "chair", label: "Chair" },
  { value: "table", label: "Table" },
  { value: "cabinet", label: "Cabinet" },
  { value: "desk", label: "Desk" },
] as const;

const FURNITURE_STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "scandinavian", label: "Scandinavian" },
  { value: "mid-century-modern", label: "Mid-Century Modern" },
] as const;

interface FurnitureOperationProps {
  onOperationSelect: (operation: "replace" | "remove") => void;
  onFurnitureTypeSelect: (type: string) => void;
  onStyleSelect: (style: string) => void;
  selectedOperation?: "replace" | "remove";
  selectedFurnitureType?: string;
  selectedStyle?: string;
}

export default function FurnitureOperation({
  onOperationSelect,
  onFurnitureTypeSelect,
  onStyleSelect,
  selectedOperation,
  selectedFurnitureType,
  selectedStyle,
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
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Furniture Type
            </label>
            <Select
              onValueChange={onFurnitureTypeSelect}
              value={selectedFurnitureType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select furniture type" />
              </SelectTrigger>
              <SelectContent>
                {FURNITURE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Style
            </label>
            <Select
              onValueChange={onStyleSelect}
              value={selectedStyle}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {FURNITURE_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Card>
  );
}

export type { FurnitureOperationProps };
