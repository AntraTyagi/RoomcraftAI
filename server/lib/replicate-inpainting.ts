import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

// Get token with validation
function getValidatedToken(): string {
  const token = process.env.REPLICATE_API_KEY;
  if (!token) {
    throw new Error("Replicate API key is missing");
  }

  // Remove any whitespace and validate format
  const cleanToken = token.trim();
  if (!cleanToken.match(/^r8_[a-zA-Z0-9]{32,}$/)) {
    throw new Error("Invalid Replicate API key format");
  }

  return cleanToken;
}

async function makeReplicateRequest(endpoint: string, body: any) {
  const token = getValidatedToken();

  console.log(`Making request to ${endpoint}`);
  console.log("Request body:", {
    ...body,
    input: {
      ...body.input,
      image: body.input.image ? '[IMAGE DATA]' : undefined,
      mask: body.input.mask ? '[MASK DATA]' : undefined
    }
  });

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
    console.error(`Replicate API error (${response.status}):`, errorText);
    throw new Error(`Replicate API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function pollPrediction(url: string) {
  const token = getValidatedToken();

  const response = await fetch(url, {
    headers: {
      "Authorization": `Token ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Prediction polling error:", errorText);
    throw new Error(`Failed to get prediction result: ${errorText}`);
  }

  return response.json();
}

export async function inpaintFurniture(
  image: string,
  mask: string,
  prompt: string
): Promise<string> {
  try {
    // Convert inputs to data URLs if they aren't already
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
    const maskUrl = mask.startsWith('data:') ? mask : `data:image/png;base64,${mask}`;

    console.log("Starting inpainting with:", {
      promptLength: prompt.length,
      maskPreview: maskUrl.substring(0, 100) + "...",
      imagePreview: imageUrl.substring(0, 100) + "..."
    });

    const prediction = await makeReplicateRequest("/predictions", {
      version: "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
      input: {
        image: imageUrl,
        mask: maskUrl,
        prompt,
        width: 512,
        height: 512,
        scheduler: "DPMSolverMultistep",
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 25
      }
    });

    console.log("Inpainting prediction created:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<string> => {
      const data = await pollPrediction(url);
      console.log("Prediction status:", data.status);

      if (data.status === "succeeded") {
        if (!data.output || !data.output[0]) {
          throw new Error("No output image received from the model");
        }
        const outputUrl = data.output[0];
        console.log("Generated image URL:", outputUrl.substring(0, 100) + "...");
        return outputUrl;
      } else if (data.status === "failed") {
        throw new Error(data.error || "Inpainting failed");
      }

      // Continue polling every 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getResult(url);
    };

    return getResult(prediction.urls.get);
  } catch (error) {
    console.error("Inpainting error:", error);
    throw error;
  }
}