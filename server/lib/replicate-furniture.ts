import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

type FurnitureType = "couch" | "bed" | "work_table" | "center_table";

const FURNITURE_PROMPTS: Record<FurnitureType, string[]> = {
  couch: [
    "modern minimalist gray sofa in a clean contemporary setting, ultra realistic product photography",
    "luxurious leather brown chesterfield sofa with tufted details, studio lighting",
    "scandinavian style beige fabric sofa with wooden legs, minimalist design",
    "mid-century modern velvet green sofa with tapered legs, professional furniture photography",
    "contemporary sectional white sofa with clean lines, showroom setting"
  ],
  bed: [
    "modern platform bed with gray upholstered headboard, minimalist bedroom setting",
    "traditional wooden sleigh bed in dark walnut finish, luxury bedroom",
    "contemporary queen bed with floating design and LED lighting",
    "rustic wooden bed frame with natural finish, farmhouse style",
    "modern canopy bed with black metal frame, urban bedroom setting"
  ],
  work_table: [
    "modern white standing desk with ergonomic design, office setting",
    "industrial style wooden desk with metal frame, workspace photography",
    "minimalist oak writing desk with cable management, home office",
    "contemporary glass top desk with chrome legs, professional setting",
    "rustic reclaimed wood desk with steel accents, studio lighting"
  ],
  center_table: [
    "modern glass coffee table with geometric metal base, living room setting",
    "rustic wooden coffee table with hairpin legs, contemporary space",
    "marble top coffee table with gold metal frame, luxury interior",
    "minimalist round coffee table in white, scandinavian design",
    "industrial style concrete coffee table, modern living space"
  ]
};

export async function generateFurnitureImage(
  type: FurnitureType,
  index: number
): Promise<string> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  try {
    const prompt = FURNITURE_PROMPTS[type][index];
    
    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
      body: JSON.stringify({
        version: "651d2cc5442c37c17bcadf3470466b4e54003bfb32f274bdd6a2da0cbe98bed3",
        input: {
          prompt,
          num_outputs: 1,
          scheduler: "K_EULER",
          steps: 4,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Furniture generation error:", error);
      throw new Error(`Failed to generate furniture image: ${error}`);
    }

    const prediction = await response.json();
    console.log("Furniture generation started:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<string> => {
      const result = await fetch(url, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        },
      });

      if (!result.ok) {
        throw new Error("Failed to get prediction result");
      }

      const data = await result.json();
      console.log("Generation status:", data.status);

      if (data.status === "succeeded") {
        return data.output[0]; // Returns the image URL
      } else if (data.status === "failed") {
        throw new Error(data.error || "Generation failed");
      }

      // Continue polling every 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getResult(url);
    };

    return getResult(prediction.urls.get);
  } catch (error) {
    console.error("Generate furniture error:", error);
    throw error;
  }
}
