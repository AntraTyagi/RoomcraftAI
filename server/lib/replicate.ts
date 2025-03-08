import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

interface ReplicateResponse {
  id: string;
  status: string;
  output?: string[];
  error?: string;
  urls: {
    get: string;
  };
}

export async function generateDesign(
  image: string,
  style: string,
  roomType?: string,
  colorTheme?: string,
  prompt?: string
): Promise<string[]> {
  console.log("=== Starting generateDesign ===");
  const token = process.env.REPLICATE_API_KEY;

  console.log("API Key check:", {
    exists: Boolean(token),
    length: token?.length,
    preview: token ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}` : 'missing'
  });

  if (!token) {
    console.error("Replicate API key is missing");
    throw new Error("Replicate API key is missing");
  }

  try {
    // Convert base64 to data URL if needed
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
    console.log("Image URL format:", {
      isDataUrl: image.startsWith('data:'),
      length: imageUrl.length,
      preview: imageUrl.substring(0, 50) + '...'
    });

    // Construct the prompt
    let designPrompt = `Transform this ${roomType?.toLowerCase() || 'room'} into a ${style.toLowerCase()} style interior design.`;
    if (colorTheme) {
      designPrompt += ` Use a ${colorTheme.toLowerCase()} color palette.`;
    }
    designPrompt += ` Maintain room layout and structure, but update decor, furniture, and color scheme.`;
    if (prompt) {
      designPrompt += ` ${prompt}`;
    }

    console.log("Request configuration:", {
      endpoint: `${REPLICATE_API_URL}/predictions`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token [HIDDEN]"
      },
      prompt: designPrompt
    });

    // Make initial request to start the prediction
    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`
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

    console.log("Initial API Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Replicate API error: ${response.status} ${errorText}`);
    }

    const prediction = await response.json() as ReplicateResponse;
    console.log("Prediction created:", {
      id: prediction.id,
      status: prediction.status,
      pollingUrl: prediction.urls.get
    });

    // Poll for results
    const getResult = async (url: string): Promise<string[]> => {
      console.log("Polling prediction:", { url });

      const result = await fetch(url, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });

      console.log("Poll response:", {
        status: result.status,
        statusText: result.statusText,
        headers: Object.fromEntries(result.headers.entries())
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("Poll error:", {
          status: result.status,
          errorText
        });
        throw new Error(`Failed to get prediction result: ${errorText}`);
      }

      const data = await result.json() as ReplicateResponse;
      console.log("Poll result:", {
        status: data.status,
        hasOutput: Boolean(data.output),
        outputLength: data.output?.length,
        error: data.error
      });

      if (data.status === "succeeded") {
        if (!Array.isArray(data.output)) {
          console.error("Invalid output format:", data.output);
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