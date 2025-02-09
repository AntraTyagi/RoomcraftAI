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
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("Replicate API key is missing");
  }

  try {
    // Convert base64 to a temporary URL using data URI
    const imageUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
      },
      body: JSON.stringify({
        // Using YOLO v8 model for object detection
        version: "2ab4c5211f11827dd17fb5c64f812ed41ae886aa690cd1f8604bdd267803a619",
        input: {
          image: imageUrl,
          confidence: 0.5, // Minimum confidence threshold
          task_type: "detect", // We want object detection
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error:", errorText);
      throw new Error(`Replicate API error: ${response.status} ${errorText}`);
    }

    const prediction = await response.json();
    console.log("Object detection prediction created:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<any> => {
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
        // Transform the YOLO output to our desired format
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

    return getResult(prediction.urls.get);
  } catch (error) {
    console.error("Object detection error:", error);
    throw error;
  }
}
