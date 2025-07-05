import { useState, useRef, useEffect } from "react";
<<<<<<< HEAD
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
=======
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
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
  selectedAreas?: Area[];
}

export default function AreaSelector({ image, onAreaSelect, selectedAreas = [] }: AreaSelectorProps) {
  const [areas, setAreas] = useState<Area[]>(selectedAreas);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update areas when selectedAreas changes
  useEffect(() => {
    if (selectedAreas.length > 0) {
      setAreas(selectedAreas);
    }
  }, [selectedAreas]);

  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      if (canvasRef.current && containerRef.current) {
        // Set canvas size to match container
        const container = containerRef.current;
        const canvas = canvasRef.current;
        canvas.width = container.clientWidth;
        canvas.height = (container.clientWidth * 3) / 4; // 4:3 aspect ratio
        drawCanvas();
      }
    };
  }, [image, areas]);

  // Combined drawing function to ensure proper layering
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const img = new Image();
    img.src = image;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw all areas
    areas.forEach(area => {
      // Fill with semi-transparent highlight
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'; // Slightly more opaque green
      ctx.fillRect(area.x, area.y, area.width, area.height);

      // Draw outer glow effect
      ctx.shadowColor = 'rgba(76, 175, 80, 0.5)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      ctx.shadowBlur = 0;

      // Draw label background
      const labelText = area.label;
      const labelMetrics = ctx.measureText(labelText);
      const labelPadding = 4;
      const labelHeight = 20;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        area.x,
        area.y - labelHeight - labelPadding,
        labelMetrics.width + (labelPadding * 2),
        labelHeight
      );

      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(labelText, area.x + labelPadding, area.y - labelPadding - 4);
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
    if (!isDrawing || !containerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Redraw everything
    drawCanvas();

    // Draw current selection with prominent preview
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.fillRect(
      startPos.x,
      startPos.y,
      x - startPos.x,
      y - startPos.y
    );

    // Animated dashed line effect
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -Date.now() / 100; // Animate the dash
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      startPos.x,
      startPos.y,
      x - startPos.x,
      y - startPos.y
    );
    ctx.setLineDash([]);
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
    drawCanvas(); // Ensure final state is drawn correctly
  };

  const removeArea = (id: string) => {
    const updatedAreas = areas.filter(area => area.id !== id);
    setAreas(updatedAreas);
    onAreaSelect(updatedAreas);
  };

  return (
    <Card className="p-4">
      <div className="relative w-full" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair border rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        />
        {areas.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none rounded-lg">
            <p className="text-sm text-muted-foreground">
              Click and drag to select areas for furniture replacement
            </p>
          </div>
        )}
      </div>
      {areas.length > 0 && (
        <div className="mt-4 space-y-2">
          {areas.map(area => (
            <div 
              key={area.id} 
              className="flex items-center justify-between bg-muted p-2 rounded hover:bg-muted/80 transition-colors"
            >
              <span className="text-sm font-medium">{area.label}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeArea(area.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
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