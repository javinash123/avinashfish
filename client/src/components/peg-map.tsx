import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Peg {
  number: number;
  x: number;
  y: number;
  status: "available" | "booked" | "selected";
  anglerName?: string;
}

interface PegMapProps {
  pegs: Peg[];
  onPegSelect?: (pegNumber: number) => void;
  selectable?: boolean;
}

export function PegMap({ pegs, onPegSelect, selectable = false }: PegMapProps) {
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);

  const handlePegClick = (peg: Peg) => {
    if (!selectable || peg.status === "booked") return;
    
    const newSelection = selectedPeg === peg.number ? null : peg.number;
    setSelectedPeg(newSelection);
    onPegSelect?.(peg.number);
    console.log(`Peg ${peg.number} ${newSelection ? 'selected' : 'deselected'}`);
  };

  const getPegColor = (peg: Peg) => {
    if (selectedPeg === peg.number) return "fill-chart-3 stroke-chart-3";
    if (peg.status === "booked") return "fill-primary/40 stroke-primary";
    if (peg.status === "available") return "fill-chart-2/40 stroke-chart-2";
    return "fill-muted stroke-border";
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-chart-2/40 border-2 border-chart-2" />
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-primary/40 border-2 border-primary" />
          <span className="text-sm">Booked</span>
        </div>
        {selectable && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-chart-3 border-2 border-chart-3" />
            <span className="text-sm">Selected</span>
          </div>
        )}
      </div>

      <TooltipProvider>
        <svg
          viewBox="0 0 800 400"
          className="w-full h-auto border border-border rounded-md bg-muted/20"
        >
          <ellipse
            cx="400"
            cy="200"
            rx="350"
            ry="150"
            fill="hsl(var(--primary) / 0.1)"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />

          {pegs.map((peg) => (
            <Tooltip key={peg.number}>
              <TooltipTrigger asChild>
                <g
                  onClick={() => handlePegClick(peg)}
                  className={selectable && peg.status !== "booked" ? "cursor-pointer" : ""}
                  data-testid={`peg-${peg.number}`}
                >
                  <circle
                    cx={peg.x}
                    cy={peg.y}
                    r="20"
                    className={`${getPegColor(peg)} transition-all hover-elevate`}
                    strokeWidth="2"
                  />
                  <text
                    x={peg.x}
                    y={peg.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-sm font-bold font-mono pointer-events-none"
                  >
                    {peg.number}
                  </text>
                </g>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-bold">Peg {peg.number}</div>
                  {peg.anglerName && (
                    <div className="text-muted-foreground">{peg.anglerName}</div>
                  )}
                  {!peg.anglerName && peg.status === "available" && (
                    <div className="text-chart-2">Available</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </svg>
      </TooltipProvider>
    </Card>
  );
}
