const REPLICATE_API_URL = "https://api.replicate.com/v1";

export async function generateDesign(
  image: string,
  style: string,
  prompt?: string
): Promise<string[]> {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  try {
    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
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
      const errorText = await response.text();
      console.error("Replicate API error:", errorText);
      throw new Error(`Replicate API error: ${response.status} ${errorText}`);
    }

    const prediction = await response.json();
    console.log("Prediction created:", prediction.id);

    // Poll for results since Replicate API is asynchronous
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
      console.log("Prediction status:", data.status);

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
  } catch (error) {
    console.error("Generate design error:", error);
    throw error;
  }
}