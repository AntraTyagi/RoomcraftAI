export interface ColorTheme {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };
  preview: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    name: "Neutral & Earthy",
    description: "A harmonious blend of warm beige, rich browns, and cream tones that create a grounded, natural atmosphere",
    colors: {
      primary: "#8B7355",    // Warm brown
      secondary: "#D2B48C",  // Tan
      accent: "#DEB887",     // Burlywood
      neutral: "#F5F5DC",    // Beige
    },
    preview: "linear-gradient(45deg, #8B7355, #D2B48C, #DEB887, #F5F5DC)",
  },
  {
    name: "Cool & Calm",
    description: "Serene combination of soft blues, gentle grays, and crisp whites for a peaceful, contemporary feel",
    colors: {
      primary: "#4682B4",    // Steel blue
      secondary: "#B0C4DE",  // Light steel blue
      accent: "#E6E6FA",     // Lavender
      neutral: "#F0F8FF",    // Alice blue
    },
    preview: "linear-gradient(45deg, #4682B4, #B0C4DE, #E6E6FA, #F0F8FF)",
  },
  {
    name: "Warm & Cozy",
    description: "Deep browns, warm grays, and terracotta hues that evoke comfort and sophistication",
    colors: {
      primary: "#8B4513",    // Saddle brown
      secondary: "#CD853F",  // Peru
      accent: "#E97451",     // Terracotta
      neutral: "#D3D3D3",    // Light gray
    },
    preview: "linear-gradient(45deg, #8B4513, #CD853F, #E97451, #D3D3D3)",
  },
  {
    name: "Bold & Vibrant",
    description: "Striking colors with dramatic contrasts for spaces that make a strong visual statement",
    colors: {
      primary: "#4B0082",    // Indigo
      secondary: "#800080",  // Purple
      accent: "#FF4500",     // Orange red
      neutral: "#2F4F4F",    // Dark slate gray
    },
    preview: "linear-gradient(45deg, #4B0082, #800080, #FF4500, #2F4F4F)",
  },
];