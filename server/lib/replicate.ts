import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

<<<<<<< HEAD
interface ReplicatePrediction {
  id: string;
  status: string;
  output: string | string[];
  error?: string;
}

export async function generateDesign(
  image: string,
  roomType: string,
  style: string,
  colorTheme: string,
  prompt: string
): Promise<{ designs: string[] }> {
  try {
    console.log("Starting design generation...");
    
    // Convert base64 to temporary URL
    const imageUrl = `data:image/jpeg;base64,${image}`;
    
    // Construct the prompt
    const fullPrompt = `A ${roomType} in ${style} style with ${colorTheme} color theme. ${prompt}. Keep the room layout and structure intact while applying the new style and colors.`;
    
    // Enhanced logging for debugging
    console.log("=== PROMPT DEBUG INFO ===");
    console.log("Room Type:", roomType);
    console.log("Style:", style);
    console.log("Color Theme:", colorTheme);
    console.log("User Prompt:", prompt);
    console.log("Full Generated Prompt:", fullPrompt);
    console.log("=== END PROMPT DEBUG ===");

    if (!process.env.REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not set in environment variables");
    }

    const requestBody = {
      version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
      input: {
        image: imageUrl,
        prompt: fullPrompt,
      },
    };

    console.log("=== API REQUEST DEBUG ===");
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    console.log("=== END API REQUEST DEBUG ===");

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
=======
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
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
    });

    if (!response.ok) {
      const errorText = await response.text();
<<<<<<< HEAD
      console.error("Replicate API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (errorText.includes("CUDA out of memory")) {
        throw new Error("The image processing service is currently experiencing high load. Please try again in a few moments or try with a smaller image.");
      }
      
      throw new Error(`Replicate API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as { id: string };
    console.log("Replicate API response:", data);

    const result = await getResult(data.id);
    console.log("Design generation completed successfully");

    // Handle both single image (string) and multiple images (array)
    let designs: string[];
    if (Array.isArray(result.output)) {
      designs = result.output;
    } else if (typeof result.output === 'string') {
      designs = [result.output];
    } else {
      console.error("Invalid output format:", result);
      throw new Error("Invalid output format from Replicate API");
    }

    return {
      designs: designs,
    };
  } catch (error: any) {
    console.error("Error in generateDesign:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error.message.includes("CUDA out of memory")) {
      throw new Error("The image processing service is currently experiencing high load. Please try again in a few moments or try with a smaller image.");
    }
    
=======
      console.error("Unstaging API error:", errorText);
      throw new Error(`Unstaging API error: ${response.status} ${errorText}`);
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
        console.error("Unstaging status error:", errorText);
        throw new Error("Failed to get unstaging result");
      }

      const data = await result.json();
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
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
    throw error;
  }
}

<<<<<<< HEAD
// Poll for results
const getResult = async (id: string): Promise<ReplicatePrediction> => {
  console.log("Polling for results with ID:", id);
  
  const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: {
      "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to get prediction status:", errorText);
    throw new Error(`Failed to get prediction status: ${errorText}`);
  }

      const data = await response.json() as ReplicatePrediction;
    
    // Enhanced logging for debugging
    console.log("=== MODEL RESPONSE DEBUG ===");
    console.log("Status:", data.status);
    console.log("Output type:", typeof data.output);
    console.log("Output:", data.output);
    console.log("Error:", data.error);
    console.log("Logs:", (data as any).logs);
    console.log("=== END MODEL RESPONSE DEBUG ===");
    
    if (data.status === "succeeded") {
      if (!data.output) {
        console.error("No output received:", data);
        throw new Error("No output images received from the model");
      }
      return data;
  } else if (data.status === "failed") {
    console.error("Design generation failed:", data.error);
    throw new Error(data.error || "Design generation failed");
  } else if (data.status === "starting" || data.status === "processing") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getResult(id);
  } else {
    throw new Error(`Unexpected status: ${data.status}`);
  }
};
=======
export async function generateDesign(
  image: string,
  style: string,
  roomType?: string,
  colorTheme?: string,
  prompt?: string
): Promise<{ designs: string[], unstagedRoom: string }> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  try {
    // First, unstage the room to remove existing furniture
    console.log("Starting unstaging process before design generation");
    const emptyRoomUrl = await unstageRoom(image);
    console.log("Room unstaged successfully, proceeding with design generation");

    // Convert the unstaged room URL to base64
    const unstageResponse = await fetch(emptyRoomUrl);
    const unstageBuffer = await unstageResponse.buffer();
    const unstageBase64 = `data:image/jpeg;base64,${unstageBuffer.toString('base64')}`;

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
      console.log("Prediction status:", data.status, "Output:", data.output);

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
    return { 
      designs: results,
      unstagedRoom: emptyRoomUrl 
    };
  } catch (error) {
    console.error("Generate design error:", error);
    throw error;
  }
}
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
