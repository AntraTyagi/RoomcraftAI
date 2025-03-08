import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

export async function generateDesign(
  image: string,
  style: string,
  roomType?: string,
  colorTheme?: string,
  prompt?: string
): Promise<string[]> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  try {
    // Convert base64 to data URL if needed
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    // Construct the prompt
    let designPrompt = `Transform this ${roomType?.toLowerCase() || 'room'} into a ${style.toLowerCase()} style interior design.`;
    if (colorTheme) {
      designPrompt += ` Use a ${colorTheme.toLowerCase()} color palette.`;
    }
    designPrompt += ` Maintain room layout and structure, but update decor, furniture, and color scheme.`;
    if (prompt) {
      designPrompt += ` ${prompt}`;
    }

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`
      },
      body: JSON.stringify({
        version: "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
          prompt: designPrompt,
          negative_prompt: "blurry, low quality, distorted, unrealistic",
          image: imageUrl,
          num_outputs: 2,
          guidance_scale: 7.5,
          num_inference_steps: 50,
          scheduler: "K_EULER_ANCESTRAL",
          width: 1024,
          height: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status} ${await response.text()}`);
    }

    const prediction = await response.json();

    // Poll for results
    const getResult = async (url: string): Promise<string[]> => {
      const result = await fetch(url, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_KEY}`
        }
      });

      if (!result.ok) {
        throw new Error(`Failed to get prediction result: ${await result.text()}`);
      }

      const data = await result.json();

      if (data.status === "succeeded") {
        return data.output;
      } else if (data.status === "failed") {
        throw new Error(data.error || "Generation failed");
      }

      // Continue polling every 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getResult(url);
    };

    return getResult(prediction.urls.get);
  } catch (error) {
    console.error("Generate design error:", error);
    throw error;
  }
}