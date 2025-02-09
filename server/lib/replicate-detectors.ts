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
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Replicate API key is missing");
  }

  try {
    // Convert base64 to a temporary URL using data URI
    const imageUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    console.log("Initiating YOLOX object detection request");
    console.log("Model: daanelson/yolox");

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        version: "ae0d70cebf6afb2ac4f5e4375eb599c178238b312c8325a9a114827ba869e3e9",
        input: {
          image: imageUrl,
          threshold: 0.3, // Lower threshold for better detection
        },
      }),
    });

    const responseData = await response.json();
    console.log("API Response status:", response.status);

    if (!response.ok) {
      console.error("YOLOX API error response:", responseData);
      throw new Error(`YOLOX API error: ${JSON.stringify(responseData)}`);
    }

    console.log("Successfully created prediction:", responseData.id);

    // Poll for results
    const getResult = async (url: string): Promise<any> => {
      console.log("Polling for results at:", url);

      const result = await fetch(url, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const data = await result.json();

      if (!result.ok) {
        console.error("Prediction status error:", data);
        throw new Error(`Failed to get prediction result: ${JSON.stringify(data)}`);
      }

      console.log("Prediction status:", data.status);

      if (data.status === "succeeded") {
        // Parse YOLOX output format
        const objects = data.output.map((detection: any) => ({
          label: detection.label || "unknown",
          confidence: detection.confidence || 0,
          box: {
            x1: detection.bbox[0] || 0,
            y1: detection.bbox[1] || 0,
            x2: detection.bbox[2] || 0,
            y2: detection.bbox[3] || 0,
          },
        }));

        console.log(`Detected ${objects.length} objects`);
        return { objects };
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