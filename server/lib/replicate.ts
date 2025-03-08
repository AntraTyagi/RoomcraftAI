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

export async function removeExistingFurniture(image: string): Promise<string> {
  const token = process.env.REPLICATE_API_KEY;
  if (!token) {
    console.error("Replicate API key is missing");
    throw new Error("Replicate API key is missing");
  }

  try {
    console.log("Starting furniture removal with unstaging model");

    // Handle both base64 and URL formats
    let imageUrl = image;
    if (image.startsWith('data:')) {
      imageUrl = image;
    } else if (image.match(/^[A-Za-z0-9+/=]+$/)) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    console.log("Making request to Replicate API...");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`
    };
    console.log("Request headers:", {
      ...headers,
      "Authorization": "Token [HIDDEN]" // Log without exposing the actual token
    });

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        version: "d41e1770837f167a28f948c6bc81baefbbaa9dfa278d6f528ce40b5a61be9b74",
        input: {
          image: imageUrl,
          prompt: "empty room, nothing",
          resolution: 1024,
          resolution_conditioning: 1024
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error response:", errorText);
      throw new Error(`Replicate API error: ${response.status} ${errorText}`);
    }

    const prediction = (await response.json()) as ReplicateResponse;
    console.log("Unstaging prediction created:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<string> => {
      console.log("Polling prediction status at:", url);
      const result = await fetch(url, {
        headers: {
          "Authorization": `Token ${token}`
        },
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("Prediction status error:", errorText);
        throw new Error(`Failed to get prediction result: ${errorText}`);
      }

      const data = (await result.json()) as ReplicateResponse;
      console.log("Prediction status:", data.status);

      if (data.status === "succeeded") {
        if (!data.output || typeof data.output !== 'string') {
          throw new Error("Invalid output format from Replicate API");
        }
        return data.output;
      } else if (data.status === "failed") {
        throw new Error(data.error || "Unstaging failed");
      }

      // Continue polling every 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getResult(url);
    };

    const emptyRoomUrl = await getResult(prediction.urls.get);
    console.log("Empty room URL generated:", emptyRoomUrl.substring(0, 50) + "...");
    return emptyRoomUrl;
  } catch (error) {
    console.error("Remove furniture error:", error);
    throw error;
  }
}

export async function generateDesign(
  image: string,
  style: string,
  roomType?: string,
  colorTheme?: string,
  prompt?: string
): Promise<string[]> {
  const token = process.env.REPLICATE_API_KEY;
  if (!token) {
    console.error("Replicate API key is missing");
    throw new Error("Replicate API key is missing");
  }

  try {
    // Handle both base64 and URL formats
    let imageUrl = image;
    if (image.startsWith('data:')) {
      imageUrl = image;
    } else if (image.match(/^[A-Za-z0-9+/=]+$/)) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    // Construct a detailed prompt incorporating all preferences
    let designPrompt = `Transform this ${roomType?.toLowerCase() || 'room'} into a ${style.toLowerCase()} style interior design.`;
    if (colorTheme) {
      designPrompt += ` Use a ${colorTheme.toLowerCase()} color palette.`;
    }
    designPrompt += ` Maintain room layout and structure, but update decor, furniture, and color scheme.`;
    if (prompt) {
      designPrompt += ` Additional requirements: ${prompt}`;
    }

    console.log("Making request to Replicate API for design generation...");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`
    };
    console.log("Request headers:", {
      ...headers,
      "Authorization": "Token [HIDDEN]"
    });

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers,
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
          height: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error response:", errorText);
      throw new Error(`Replicate API error: ${response.status} ${errorText}`);
    }

    const prediction = (await response.json()) as ReplicateResponse;
    console.log("Design prediction created:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<string[]> => {
      console.log("Polling prediction status at:", url);
      const result = await fetch(url, {
        headers: {
          "Authorization": `Token ${token}`
        },
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("Prediction status error:", errorText);
        throw new Error(`Failed to get prediction result: ${errorText}`);
      }

      const data = (await result.json()) as ReplicateResponse;
      console.log("Design prediction status:", data.status);

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

    const results = await getResult(prediction.urls.get);
    console.log(`Generated ${results.length} design(s)`);
    return results;
  } catch (error) {
    console.error("Generate design error:", error);
    throw error;
  }
}