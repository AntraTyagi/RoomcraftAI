interface FurnitureType {
  name: string;
  label: string;
  description: string;
  image: string;
  styles: string[];
}

interface FurnitureStyle {
  name: string;
  label: string;
  description: string;
  image: string;
}

interface FurnitureColor {
  name: string;
  label: string;
  hex: string;
  description: string;
}

export const FURNITURE_TYPES: FurnitureType[] = [
  {
    name: "sofa",
    label: "Sofa / Couch",
    description: "Comfortable seating for your living space",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    styles: ["modern", "traditional", "contemporary", "minimalist", "rustic"],
  },
  {
    name: "chair",
    label: "Chair",
    description: "Single-seat furniture for various spaces",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267",
    styles: ["modern", "traditional", "contemporary", "minimalist", "rustic"],
  },
  {
    name: "dining-table",
    label: "Dining Table",
    description: "Table for dining and gathering",
    image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7",
    styles: ["modern", "traditional", "contemporary", "minimalist", "rustic"],
  },
  {
    name: "bed",
    label: "Bed",
    description: "Comfortable sleeping furniture",
    image: "https://images.unsplash.com/photo-1505693314120-0d443867891c",
    styles: ["modern", "traditional", "contemporary", "minimalist", "rustic"],
  },
  {
    name: "cabinet",
    label: "Cabinet / Storage",
    description: "Storage solutions for any room",
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2",
    styles: ["modern", "traditional", "contemporary", "minimalist", "rustic"],
  },
];

export const FURNITURE_STYLES: FurnitureStyle[] = [
  {
    name: "modern",
    label: "Modern",
    description: "Clean lines and contemporary aesthetics",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
  },
  {
    name: "traditional",
    label: "Traditional",
    description: "Classic and timeless design elements",
    image: "https://images.unsplash.com/photo-1600210491369-e753d80a41f3",
  },
  {
    name: "contemporary",
    label: "Contemporary",
    description: "Current trends and modern interpretations",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
  },
  {
    name: "minimalist",
    label: "Minimalist",
    description: "Simple, clean, and functional design",
    image: "https://images.unsplash.com/photo-1567225557594-88d73e55f2cb",
  },
  {
    name: "rustic",
    label: "Rustic",
    description: "Natural materials and traditional craftsmanship",
    image: "https://images.unsplash.com/photo-1533377352188-f73d6086898e",
  },
];

export const FURNITURE_COLORS: FurnitureColor[] = [
  {
    name: "natural-wood",
    label: "Natural Wood",
    hex: "#8B4513",
    description: "Warm, authentic wood tones",
  },
  {
    name: "white",
    label: "White",
    hex: "#FFFFFF",
    description: "Clean, bright white finish",
  },
  {
    name: "black",
    label: "Black",
    hex: "#000000",
    description: "Classic, bold black",
  },
  {
    name: "gray",
    label: "Gray",
    hex: "#808080",
    description: "Neutral, versatile gray",
  },
  {
    name: "navy",
    label: "Navy Blue",
    hex: "#000080",
    description: "Deep, sophisticated blue",
  },
  {
    name: "emerald",
    label: "Emerald Green",
    hex: "#046307",
    description: "Rich, luxurious green",
  },
  {
    name: "burgundy",
    label: "Burgundy",
    hex: "#800020",
    description: "Deep, sophisticated red",
  },
];
