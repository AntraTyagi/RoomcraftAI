import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

type FurnitureType = "couch" | "bed" | "work_table" | "center_table";

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

export async function generateFurnitureImage(
  type: FurnitureType,
  index: number
): Promise<string> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Replicate API key is missing");
  }

  try {
    const prompt = FURNITURE_PROMPTS[type][index];
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

      const data = await result.json() as any;
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