import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

async function removeExistingFurniture(image: string): Promise<string> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  try {
    // Convert base64 to a temporary URL using data URI
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    console.log('Sending request to Replicate unstaging model');

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
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
      console.error("Replicate API error:", errorText);
      throw new Error(`Replicate API error: ${response.status} ${errorText}`);
    }

    const prediction = await response.json();
    console.log("Unstaging prediction created:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<string> => {
      const result = await fetch(url, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        },
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("Prediction status error:", errorText);
        throw new Error("Failed to get prediction result");
      }

      const data = await result.json();
      console.log("Unstaging prediction status:", data.status, "Output:", data.output);

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
    console.log("Empty room generated:", emptyRoomUrl);
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
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  try {
    // First, remove existing furniture
    console.log('Step 1: Removing existing furniture');
    const emptyRoomUrl = await removeExistingFurniture(image);
    console.log('Empty room generated, proceeding with design generation');

    // Construct a detailed prompt incorporating all preferences
    let designPrompt = `Transform this ${roomType?.toLowerCase() || 'room'} into a ${style.toLowerCase()} style interior design.`;

    if (colorTheme) {
      designPrompt += ` Use a ${colorTheme.toLowerCase()} color palette.`;
    }

    designPrompt += ` Maintain room layout and structure, but update decor, furniture, and color scheme.`;

    if (prompt) {
      designPrompt += ` Additional requirements: ${prompt}`;
    }

    console.log('Sending request to Replicate with prompt:', designPrompt);

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
      body: JSON.stringify({
        version: "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        input: {
          prompt: designPrompt,
          negative_prompt: "blurry, low quality, distorted, unrealistic",
          image: emptyRoomUrl, // Use the empty room as input
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
      console.error("Replicate API error:", errorText);
      throw new Error(`Replicate API error: ${response.status} ${errorText}`);
    }

    const prediction = await response.json();
    console.log("Design prediction created:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<string[]> => {
      const result = await fetch(url, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        },
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("Prediction status error:", errorText);
        throw new Error("Failed to get prediction result");
      }

      const data = await result.json();
      console.log("Design prediction status:", data.status, "Output:", data.output);

      if (data.status === "succeeded") {
        if (!Array.isArray(data.output) || data.output.length === 0) {
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
    console.log("Generated images:", results);
    return results;
  } catch (error) {
    console.error("Generate design error:", error);
    throw error;
  }
}