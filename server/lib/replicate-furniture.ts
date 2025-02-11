import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

type FurnitureType = "couch" | "bed" | "work_table" | "center_table";

function createDetailedPrompt(furniture: {
  name: string;
  description: string;
}, matchingObject?: { label: string }) {
  const styleParts = furniture.name.toLowerCase().split(' ');
  const styleWords = new Set(['modern', 'classic', 'contemporary', 'scandinavian', 'mid-century', 'minimalist', 'industrial']);
  const detectedStyle = styleParts.find(word => styleWords.has(word)) || 'contemporary';

  return `Replace the masked area with ${furniture.name.toLowerCase()}, ${furniture.description}. 
    The furniture style should be ${detectedStyle} with high-end materials and craftsmanship.
    Maintain the exact same position, scale, and perspective as the ${matchingObject?.label || 'furniture'} in the original image.
    Match the room's lighting conditions, shadows, and ambient light reflections.
    Ensure photorealistic rendering with detailed materials, textures, and fabric details.
    Requirements:
    - 8k resolution
    - Professional interior photography quality
    - Perfect lighting and shadows
    - Ultra realistic materials
    - Natural integration with surroundings
    ${matchingObject ? `Replace the existing ${matchingObject.label} while maintaining its exact positioning, scale, and perspective.` : ''}
    The new furniture should seamlessly blend with the room's existing aesthetic and appear as if it was originally photographed in place.`;
}

async function generateInpaintingPrompt(
  furniture: { name: string; description: string; },
  matchingObject?: { label: string }
): Promise<string> {
  return createDetailedPrompt(furniture, matchingObject);
}

async function generateFurnitureImage(
  type: FurnitureType,
  index: number,
  furniture: { name: string; description: string; },
  matchingObject?: { label: string }
): Promise<string> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Replicate API key is missing");
  }

  try {
    const prompt = createDetailedPrompt(furniture, matchingObject);
    console.log("Starting furniture generation with type:", type, "index:", index);
    console.log("Using prompt:", prompt);

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        version: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f",
        input: {
          prompt,
          negative_prompt: "low quality, blurry, distorted, deformed",
          num_inference_steps: 4,
          guidance_scale: 7.5,
          width: 768,
          height: 768,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Replicate API error response:", error);
      throw new Error(`Failed to start prediction: ${error}`);
    }

    const prediction = await response.json();
    console.log("Furniture generation started:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<string> => {
      console.log("Polling for results at:", url);

      const result = await fetch(url, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!result.ok) {
        const error = await result.text();
        console.error("Prediction status error:", error);
        throw new Error(`Failed to get prediction result: ${error}`);
      }

      const data = await result.json();
      console.log("Generation status:", data.status);

      if (data.status === "succeeded") {
        console.log("Generation completed successfully");
        return data.output[0] as string;
      } else if (data.status === "failed") {
        console.error("Generation failed:", data.error);
        throw new Error(data.error || "Generation failed");
      }

      // Continue polling every 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getResult(url);
    };

    return getResult((prediction as any).urls.get);
  } catch (error) {
    console.error("Furniture generation error:", error);
    throw error;
  }
}

const FURNITURE_PROMPTS: Record<FurnitureType, string[]> = {
  couch: [
    "modern minimalist sofa, product photography",
    "classic leather couch, studio lighting",
    "contemporary fabric sofa, clean lines",
    "scandinavian style sofa, natural light",
    "mid-century modern sofa, professional photo"
  ],
  bed: [
    "modern platform bed, minimal design",
    "classic wooden bed frame, bedroom setting",
    "contemporary queen bed, clean design",
    "rustic wood bed frame, natural finish",
    "modern bed with headboard, professional photo"
  ],
  work_table: [
    "modern desk, minimal design",
    "wooden writing desk, office setting",
    "contemporary desk, clean lines",
    "industrial style desk, workspace",
    "minimalist work table, studio photo"
  ],
  center_table: [
    "modern coffee table, minimal design",
    "wooden coffee table, living room",
    "glass coffee table, contemporary",
    "round coffee table, scandinavian style",
    "industrial coffee table, studio photo"
  ]
};

export { generateInpaintingPrompt, generateFurnitureImage, FURNITURE_PROMPTS };