import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

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
    });

    if (!response.ok) {
      const errorText = await response.text();
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
    
    throw error;
  }
}

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