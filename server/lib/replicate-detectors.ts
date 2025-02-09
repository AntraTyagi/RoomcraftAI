import fetch from "node-fetch";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

export async function detectObjectsInImage(base64Image: string): Promise<{
  objects: Array<{
    label: string;
    confidence: number;
    box: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  }>;
}> {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("Replicate API token is missing");
  }

  try {
    // Convert base64 to a temporary URL using data URI
    const imageUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    console.log("Initiating Replicate API request for object detection");
    console.log("API URL:", REPLICATE_API_URL);
    console.log("Token present:", !!token);

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "8c869771f9da8bb40173c68d14534c498d86b63219aa82c48d09677da0ec31d8",
        input: {
          image: imageUrl,
          confidence: 0.35,
          task_type: "detect",
        },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Replicate API error response:", responseData);
      throw new Error(`Replicate API error: ${JSON.stringify(responseData)}`);
    }

    console.log("Successfully created prediction:", responseData.id);

    // Poll for results
    const getResult = async (url: string): Promise<any> => {
      console.log("Polling for results at:", url);

      const result = await fetch(url, {
        headers: {
          "Authorization": `Token ${token}`,
        },
      });

      const data = await result.json();

      if (!result.ok) {
        console.error("Prediction status error:", data);
        throw new Error(`Failed to get prediction result: ${JSON.stringify(data)}`);
      }

      console.log("Prediction status:", data.status);

      if (data.status === "succeeded") {
        return {
          objects: data.output.map((obj: any) => ({
            label: obj.label,
            confidence: obj.confidence,
            box: {
              x1: obj.box.x1,
              y1: obj.box.y1,
              x2: obj.box.x2,
              y2: obj.box.y2,
            },
          })),
        };
      } else if (data.status === "failed") {
        throw new Error(data.error || "Object detection failed");
      }

      // Continue polling every 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getResult(url);
    };

    return getResult(responseData.urls.get);
  } catch (error) {
    console.error("Object detection error:", error);
    throw error;
  }
}