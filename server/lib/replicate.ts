import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

interface ReplicateResponse {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
  urls: {
    get: string;
  };
}

async function makeReplicateRequest(endpoint: string, body: any) {
  const token = process.env.REPLICATE_API_KEY;
  if (!token) {
    throw new Error("Replicate API key is missing");
  }

  const response = await fetch(`${REPLICATE_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Replicate API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function pollPrediction(url: string) {
  const token = process.env.REPLICATE_API_KEY;
  if (!token) {
    throw new Error("Replicate API key is missing");
  }

  const response = await fetch(url, {
    headers: {
      "Authorization": `Token ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get prediction result: ${errorText}`);
  }

  return response.json();
}

export async function generateDesign(
  image: string,
  style: string,
  roomType?: string,
  colorTheme?: string,
  prompt?: string
): Promise<string[]> {
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

    const prediction = await makeReplicateRequest("/predictions", {
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
        height: 1024,
      }
    });

    // Poll for results
    const getResult = async (url: string): Promise<string[]> => {
      const data = await pollPrediction(url);

      if (data.status === "succeeded") {
        if (!Array.isArray(data.output)) {
          throw new Error("Invalid output format from Replicate API");
        }
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