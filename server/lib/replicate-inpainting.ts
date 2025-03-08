import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

export async function inpaintFurniture(
  image: string,
  mask: string,
  prompt: string
): Promise<string> {
  const token = process.env.REPLICATE_API_KEY;
  if (!token) {
    console.error("Replicate API key is missing");
    throw new Error("Replicate API key is missing");
  }

  try {
    console.log("Starting inpainting with:", {
      promptLength: prompt.length,
      maskLength: mask.length,
      imageLength: image.length
    });

    // Convert inputs to data URLs if they aren't already
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
    const maskUrl = mask.startsWith('data:') ? mask : `data:image/png;base64,${mask}`;

    // Log the first 100 characters of each base64 string for debugging
    console.log("Input data preview:", {
      imagePreview: imageUrl.substring(0, 100) + "...",
      maskPreview: maskUrl.substring(0, 100) + "...",
      promptPreview: prompt.substring(0, 100) + "..."
    });

    console.log("Making request to Replicate API for inpainting...");
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
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error response:", errorText);
      throw new Error(`Failed to start inpainting: ${errorText}`);
    }

    const prediction = await response.json();
    console.log("Inpainting prediction created:", prediction.id);

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

      const data = await result.json();
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