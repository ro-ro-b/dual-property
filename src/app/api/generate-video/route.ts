import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — Veo can take up to 6 min

/**
 * POST /api/generate-video
 * Generate an AI cinematic property video using Google Gemini Veo.
 *
 * Body: { name, city, country, propertyType, description,
 *         imageBase64?, imageMimeType? }
 *
 * If imageBase64 is provided, uses image-to-video (animates the AI-generated image).
 * Otherwise uses text-to-video.
 *
 * Returns: { success: true, videoUrl: string, prompt: string }
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured. Get one at https://aistudio.google.com/apikey" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = buildVideoPrompt(body);
    const imageBase64 = body.imageBase64;
    const imageMimeType = body.imageMimeType || "image/png";

    const ai = new GoogleGenAI({ apiKey });

    // Build the generation request
    const generateParams: any = {
      model: "veo-3.1-generate-preview",
      prompt,
      config: {
        aspectRatio: "16:9",
        numberOfVideos: 1,
      },
    };

    // If we have the AI-generated image, use image-to-video
    if (imageBase64) {
      generateParams.image = {
        imageBytes: imageBase64,
        mimeType: imageMimeType,
      };
    }

    // Submit generation (returns a long-running operation)
    let operation = await ai.models.generateVideos(generateParams);

    // Poll until done (every 10s, up to ~5 min)
    const maxPolls = 30;
    for (let i = 0; i < maxPolls && !operation.done; i++) {
      await new Promise((r) => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (!operation.done) {
      return NextResponse.json(
        { error: "Video generation timed out. Please try again." },
        { status: 504 }
      );
    }

    // Extract the generated video
    const generatedVideos = operation.response?.generatedVideos || [];
    if (generatedVideos.length === 0) {
      return NextResponse.json(
        { error: "No video returned from Gemini Veo. Try a different description." },
        { status: 500 }
      );
    }

    const videoFile = generatedVideos[0].video;

    // Return as data URL (Vercel serverless has read-only filesystem)
    let videoBase64 = "";
    if (videoFile?.uri) {
      const dlUrl = videoFile.uri.includes("?")
        ? `${videoFile.uri}&key=${apiKey}`
        : `${videoFile.uri}?key=${apiKey}`;
      const dlRes = await fetch(dlUrl);
      if (!dlRes.ok) {
        return NextResponse.json(
          { error: `Failed to download video: ${dlRes.status}` },
          { status: 500 }
        );
      }
      const buffer = Buffer.from(await dlRes.arrayBuffer());
      videoBase64 = buffer.toString("base64");
    } else if (videoFile?.videoBytes) {
      videoBase64 = typeof videoFile.videoBytes === "string"
        ? videoFile.videoBytes
        : Buffer.from(videoFile.videoBytes).toString("base64");
    } else {
      return NextResponse.json(
        { error: "Video generated but no download URI available." },
        { status: 500 }
      );
    }

    const videoUrl = `data:video/mp4;base64,${videoBase64}`;

    return NextResponse.json({
      success: true,
      videoUrl,
      prompt,
    });
  } catch (err: any) {
    console.error("Video generation error:", err);
    return NextResponse.json(
      { error: err.message || "Video generation failed" },
      { status: 500 }
    );
  }
}

/**
 * Builds a cinematic video prompt from property metadata.
 */
function buildVideoPrompt(data: Record<string, any>): string {
  const name = data.name || "Luxury Property";
  const city = data.city || "";
  const country = data.country || "";
  const propertyType = data.propertyType || "residential";
  const description = data.description || "";

  const visualMap: Record<string, string> = {
    residential: "luxury residential tower at golden hour, warm interior glow, penthouse balcony views, landscaped rooftop garden",
    commercial: "sleek glass office building reflecting sunset, bustling lobby, professional corporate atmosphere",
    mixed: "vibrant mixed-use precinct, street-level cafes and shops, residential balconies above, city life",
    industrial: "dramatic warehouse conversion, exposed beams and brick, modern creative workspace, artistic lighting",
    retail: "premium retail boulevard at twilight, illuminated shopfronts, luxury brand window displays",
    hotel: "five-star hotel arrival, grand chandelier lobby, infinity pool overlooking city, resort luxury",
    land: "sweeping aerial drone shot of development site, sunrise over the city skyline, future potential",
  };

  const visualPalette = visualMap[propertyType] || visualMap.residential;

  const locationVibes =
    city && country
      ? `${city}, ${country} cityscape`
      : city
        ? `${city} urban landscape`
        : "prestigious metropolitan location";

  return [
    `Cinematic drone aerial reveal of ${name}, a premium real estate development.`,
    `${visualPalette}.`,
    `Set against the ${locationVibes}.`,
    `Smooth camera movement sweeping from exterior facade to interior luxury finishes.`,
    description ? `${description.substring(0, 150)}.` : "",
    `Professional real estate cinematography, 4K cinematic, shallow depth of field, golden hour lighting, luxury property marketing aesthetic.`,
  ].filter(Boolean).join(" ");
}
