import { ThemeProvider } from "../theme-provider";
import { PegMap } from "../peg-map";

export default function PegMapExample() {
  const mockPegs = [
    { number: 1, x: 100, y: 80, status: "available" as const },
    { number: 2, x: 180, y: 70, status: "booked" as const, anglerName: "John Smith" },
    { number: 3, x: 260, y: 65, status: "available" as const },
    { number: 4, x: 340, y: 60, status: "booked" as const, anglerName: "Sarah Jones" },
    { number: 5, x: 420, y: 65, status: "available" as const },
    { number: 6, x: 500, y: 70, status: "available" as const },
    { number: 7, x: 580, y: 80, status: "booked" as const, anglerName: "Mike Brown" },
    { number: 8, x: 650, y: 100, status: "available" as const },
    { number: 9, x: 700, y: 130, status: "available" as const },
    { number: 10, x: 720, y: 170, status: "booked" as const, anglerName: "Emma Davis" },
    { number: 11, x: 720, y: 230, status: "available" as const },
    { number: 12, x: 700, y: 270, status: "available" as const },
    { number: 13, x: 650, y: 300, status: "available" as const },
    { number: 14, x: 580, y: 320, status: "booked" as const, anglerName: "Tom Wilson" },
    { number: 15, x: 500, y: 330, status: "available" as const },
    { number: 16, x: 420, y: 335, status: "available" as const },
    { number: 17, x: 340, y: 340, status: "available" as const },
    { number: 18, x: 260, y: 335, status: "booked" as const, anglerName: "Lisa Taylor" },
    { number: 19, x: 180, y: 330, status: "available" as const },
    { number: 20, x: 100, y: 320, status: "available" as const },
  ];

  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <PegMap
          pegs={mockPegs}
          selectable={true}
          onPegSelect={(peg) => console.log("Selected peg:", peg)}
        />
      </div>
    </ThemeProvider>
  );
}
