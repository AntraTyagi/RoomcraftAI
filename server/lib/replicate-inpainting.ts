import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

export async function inpaintFurniture(
  image: string,
  mask: string,
  prompt: string
): Promise<string> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Replicate API key is missing");
  }

  try {
    console.log("Starting inpainting with prompt:", prompt);

    // Convert inputs to data URLs if they aren't already
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
    const maskUrl = mask.startsWith('data:') ? mask : `data:image/png;base64,${mask}`;

    console.log("Sending request to stability-ai/stable-diffusion-inpainting model");

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        version: "be04660a5b93ef2aff61e3668dedb4cbeb14941e62a3fd5998506626478d8fd0",
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: prompt,
          num_inference_steps: 50,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Replicate API error response:", error);
      throw new Error(`Failed to start inpainting: ${error}`);
    }

    const prediction = await response.json();
    console.log("Inpainting started:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<string> => {
      console.log("Polling for results at:", url);

      const result = await fetch(url, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!result.ok) {
        const error = await result.text();
        console.error("Prediction status error:", error);
        throw new Error(`Failed to get prediction result: ${error}`);
      }

      const data = await result.json() as any;
      console.log("Inpainting status:", data.status);

      if (data.status === "succeeded") {
        console.log("Inpainting completed successfully");
        if (!data.output || !data.output[0]) {
          throw new Error("No output image received from the model");
        }
        return data.output[0] as string;
      } else if (data.status === "failed") {
        console.error("Inpainting failed:", data.error);
        throw new Error(data.error || "Inpainting failed");
      }

      // Continue polling every 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getResult(url);
    };

    return getResult((prediction as any).urls.get);
  } catch (error) {
    console.error("Inpainting error:", error);
    throw error;
  }
}