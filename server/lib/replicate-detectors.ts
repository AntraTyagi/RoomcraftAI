import Replicate from "replicate";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

const DEFAULT_FURNITURE_QUERY = `
  table, dining table, coffee table, side table, center table, console table,
  chair, accent chair, dining chair, office chair, bar stool,
  sofa, couch, sectional sofa, loveseat,
  tv console, tv stand, entertainment center,
  refrigerator, fridge,
  kitchen counter, kitchen cabinet, kitchen island,
  bar stools, counter stools,
  indoor plants, potted plants,
  wall art, paintings, artwork,
  curtains, window treatments,
  bookshelf, shelving unit,
  bed, headboard,
  dresser, wardrobe, chest of drawers,
  desk, work table,
  ottoman, footstool,
  cabinet, storage unit
`.trim().replace(/\s+/g, ' ');

export async function detectObjectsInImage(base64Image: string, query?: string): Promise<{
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

    console.log("Initiating Grounding DINO detection request");
    console.log("Model: adirik/grounding-dino");

    const replicate = new Replicate({ auth: token });

    const output = await replicate.run(
      "adirik/grounding-dino:efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa",
      {
        input: {
          image: imageUrl,
          query: query || `Find and identify any of these items in the image: ${DEFAULT_FURNITURE_QUERY}`,
          box_threshold: 0.2,
          text_threshold: 0.2
        }
      }
    );

    console.log("Detection completed:", output);

    // Convert Grounding DINO output format to our API format
    const objects = (output as any).detections.map((detection: any) => ({
      label: detection.label,
      confidence: 0.9, // Grounding DINO doesn't provide confidence scores
      box: {
        x1: detection.bbox[0],
        y1: detection.bbox[1],
        x2: detection.bbox[2],
        y2: detection.bbox[3]
      }
    }));

    console.log(`Detected ${objects.length} objects`);
    return { objects };

  } catch (error) {
    console.error("Object detection error:", error);
    throw error;
  }
}