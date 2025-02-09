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
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("Replicate API token is missing");
  }

  try {
    // Convert base64 to a temporary URL using data URI
    const imageUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify({
        // Using YOLOv8x model for improved object detection
        version: "8c869771f9da8bb40173c68d14534c498d86b63219aa82c48d09677da0ec31d8",
        input: {
          image: imageUrl,
          confidence: 0.35, // Lower threshold to detect more objects
          task_type: "detect",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Replicate API error:", errorData);
      throw new Error(`Replicate API error: ${JSON.stringify(errorData)}`);
    }

    const prediction: any = await response.json();
    console.log("Object detection prediction created:", prediction.id);

    // Poll for results
    const getResult = async (url: string): Promise<any> => {
      const result = await fetch(url, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      if (!result.ok) {
        const errorData = await result.json();
        console.error("Prediction status error:", errorData);
        throw new Error(`Failed to get prediction result: ${JSON.stringify(errorData)}`);
      }

      const data: any = await result.json();
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