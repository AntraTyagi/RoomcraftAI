import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

// Define response types for Replicate API
interface ReplicatePrediction {
  id: string;
  urls: {
    get: string;
    cancel: string;
  };
  status: string;
  output?: string | string[];
  error?: string;
}

interface ReplicateStatusResponse {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
}

async function unstageRoom(image: string): Promise<string> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  try {
    // Convert base64 to a temporary URL using data URI
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    console.log('Starting unstaging process...');

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
      console.error("Unstaging API error:", errorText);
      throw new Error(`Unstaging API error: ${response.status} ${errorText}`);
    }

    const prediction = await response.json() as ReplicatePrediction;
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
        console.error("Unstaging status error:", errorText);
        throw new Error("Failed to get unstaging result");
      }

      const data = await result.json() as ReplicateStatusResponse;
      console.log("Unstaging status:", data.status, "Output:", data.output);

      if (data.status === "succeeded") {
        if (!data.output || typeof data.output !== 'string') {
          throw new Error("Invalid output format from Unstaging API");
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
    console.log("Generated empty room URL:", emptyRoomUrl);
    return emptyRoomUrl;
  } catch (error) {
    console.error("Unstaging error:", error);
    throw error;
  }
}

export async function generateDesign(
  image: string,
  style: string,
  roomType?: string,
  colorTheme?: string,
  prompt?: string
): Promise<{ designs: string[], unstagedRoom: string }> {
  if (!process.env.REPLICATE_API_KEY) {
    console.error("REPLICATE_API_KEY is missing");
    throw new Error("Replicate API key is missing");
  }

  try {
    console.log("=== DESIGN GENERATION PROCESS STARTED ===");
    console.log(`Style: ${style}, Room Type: ${roomType || 'Not specified'}, Color Theme: ${colorTheme || 'Not specified'}`);
    console.log(`Custom prompt: ${prompt || 'None'}`);
    
    // First, unstage the room to remove existing furniture
    console.log("1. Starting unstaging process before design generation");
    const imagePreview = image.substring(0, 50) + "..."; // Log preview of the image string
    console.log(`Image data preview: ${imagePreview}`);
    
    const emptyRoomUrl = await unstageRoom(image);
    console.log("2. Room unstaged successfully, obtained URL:", emptyRoomUrl);

    // Validate unstaged room URL
    if (!emptyRoomUrl || typeof emptyRoomUrl !== 'string' || !emptyRoomUrl.startsWith('http')) {
      console.error("Invalid unstaged room URL:", emptyRoomUrl);
      throw new Error("Failed to get valid unstaged room URL");
    }

    // Convert the unstaged room URL to base64
    console.log("3. Fetching unstaged room image from URL");
    let unstageResponse;
    try {
      unstageResponse = await fetch(emptyRoomUrl);
      if (!unstageResponse.ok) {
        throw new Error(`Failed to fetch unstaged room image: ${unstageResponse.status} ${unstageResponse.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching unstaged room:", error);
      throw new Error("Failed to fetch unstaged room image");
    }

    const unstageBuffer = await unstageResponse.buffer();
    const unstageBase64 = `data:image/jpeg;base64,${unstageBuffer.toString('base64')}`;
    console.log("4. Successfully converted unstaged room to base64");

    // Construct a detailed prompt incorporating all preferences
    let designPrompt = `Transform this ${roomType?.toLowerCase() || 'room'} into a ${style.toLowerCase()} style interior design.`;

    if (colorTheme) {
      designPrompt += ` Use a ${colorTheme.toLowerCase()} color palette.`;
    }

    designPrompt += ` Maintain room layout and structure, but update decor, furniture, and color scheme.`;

    if (prompt) {
      designPrompt += ` Additional requirements: ${prompt}`;
    }

    console.log('5. Sending request to Replicate with prompt:', designPrompt);
    console.log('   Using model version: c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316');

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
          image: unstageBase64,
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
      console.error("6. Replicate API error:", errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Detailed error:", JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // If not valid JSON, the error text was already logged
      }
      throw new Error(`Replicate API error: ${response.status} ${errorText}`);
    }

    const prediction = await response.json() as ReplicatePrediction;
    console.log("6. Design prediction created with ID:", prediction.id);
    console.log("   Polling URL:", prediction.urls.get);

    // Poll for results
    const getResult = async (url: string): Promise<string[]> => {
      console.log("   Polling prediction status at:", url);
      const result = await fetch(url, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        },
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("7. Prediction status error:", errorText);
        throw new Error("Failed to get prediction result");
      }

      const data = await result.json() as ReplicateStatusResponse;
      console.log("7. Prediction status:", data.status);
      
      if (data.output) {
        console.log("   Output available:", Array.isArray(data.output) ? 
          `${data.output.length} images` : typeof data.output);
      }

      if (data.status === "succeeded") {
        if (!Array.isArray(data.output) || data.output.length === 0) {
          console.error("Invalid output format:", data.output);
          throw new Error("Invalid output format from Replicate API");
        }
        
        // Safely cast the output to string array
        const outputUrls = data.output as string[];
        console.log("8. Generation succeeded with output URLs:", 
          outputUrls.map((url: string) => url.substring(0, 30) + "...").join(", "));
        return outputUrls;
      } else if (data.status === "failed") {
        console.error("Generation failed:", data.error || "Unknown error");
        throw new Error(data.error || "Generation failed");
      } else if (data.status === "processing") {
        console.log("   Still processing, waiting...");
      }

      // Continue polling every 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getResult(url);
    };

    const results = await getResult(prediction.urls.get);
    console.log("9. Final results received:", results.length, "images");
    
    if (!results || results.length === 0) {
      throw new Error("No design images were generated");
    }
    
    console.log("=== DESIGN GENERATION COMPLETED SUCCESSFULLY ===");
    
    return { 
      designs: results,
      unstagedRoom: emptyRoomUrl 
    };
  } catch (error: any) {
    console.error("=== DESIGN GENERATION FAILED ===");
    console.error("Error details:", error.message || "Unknown error");
    console.error("Error stack:", error.stack);
    throw error;
  }
}