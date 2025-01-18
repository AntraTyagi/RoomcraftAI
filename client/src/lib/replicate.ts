const REPLICATE_API_URL = "https://api.replicate.com/v1";

export async function generateDesign(
  image: string,
  style: string,
  prompt?: string
): Promise<string[]> {
  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${import.meta.env.VITE_REPLICATE_API_KEY}`,
    },
    body: JSON.stringify({
      version: "YOUR_MODEL_VERSION",
      input: {
        image,
        style,
        prompt: prompt || `Transform this room into a ${style} style interior`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate design");
  }

  const prediction = await response.json();
  return prediction.output;
}
