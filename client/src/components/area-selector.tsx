import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface Area {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface AreaSelectorProps {
  image: string;
  onAreaSelect: (areas: Area[]) => void;
}

export default function AreaSelector({ image, onAreaSelect }: AreaSelectorProps) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      drawImage();
      drawAreas();
    };
  }, [image, areas]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  const drawAreas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    areas.forEach(area => {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(area.x, area.y, area.width, area.height);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImage();
    drawAreas();

    // Draw current selection
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      startPos.x,
      startPos.y,
      x - startPos.x,
      y - startPos.y
    );
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add new area if it's large enough
    const width = Math.abs(x - startPos.x);
    const height = Math.abs(y - startPos.y);

    if (width > 20 && height > 20) {
      const newArea: Area = {
        id: Date.now().toString(),
        x: Math.min(startPos.x, x),
        y: Math.min(startPos.y, y),
        width,
        height,
        label: `Area ${areas.length + 1}`
      };

      const updatedAreas = [...areas, newArea];
      setAreas(updatedAreas);
      onAreaSelect(updatedAreas);
    }

    setIsDrawing(false);
  };

  const removeArea = (id: string) => {
    const updatedAreas = areas.filter(area => area.id !== id);
    setAreas(updatedAreas);
    onAreaSelect(updatedAreas);
  };

  return (
    <Card className="p-4">
      <div className="relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border rounded cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        />
        {areas.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
            <p className="text-sm text-muted-foreground">
              Click and drag to select areas for furniture replacement
            </p>
          </div>
        )}
      </div>
      {areas.length > 0 && (
        <div className="mt-4 space-y-2">
          {areas.map(area => (
            <div key={area.id} className="flex items-center justify-between bg-muted p-2 rounded">
              <span className="text-sm">{area.label}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeArea(area.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}