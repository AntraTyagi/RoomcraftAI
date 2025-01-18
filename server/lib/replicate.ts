const REPLICATE_API_URL = "https://api.replicate.com/v1";

export async function generateDesign(
  image: string,
  style: string,
  prompt?: string
): Promise<string[]> {
  if (!process.env.VITE_REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.VITE_REPLICATE_API_KEY}`,
    },
    body: JSON.stringify({
      version: "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
      input: {
        prompt: prompt || `Transform this room into a ${style.toLowerCase()} style interior design. Maintain room layout and structure, but update decor, furniture, and color scheme.`,
        image: image.split(",")[1], // Remove data URL prefix
        num_outputs: 4,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        scheduler: "K_EULER_ANCESTRAL",
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate design");
  }

  const prediction = await response.json();

  // Poll for results since Replicate API is asynchronous
  const getResult = async (url: string): Promise<string[]> => {
    const result = await fetch(url, {
      headers: {
        Authorization: `Token ${process.env.VITE_REPLICATE_API_KEY}`,
      },
    });

    if (!result.ok) {
      throw new Error("Failed to get prediction result");
    }

    const data = await result.json();

    if (data.status === "succeeded") {
      return data.output;
    } else if (data.status === "failed") {
      throw new Error(data.error || "Generation failed");
    }

    // Continue polling every 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getResult(url);
  };

  return getResult(prediction.urls.get);
}
