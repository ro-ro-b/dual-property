import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/generate-image
 * Generate an AI property product image using Google Gemini.
 *
 * Body: { name, address, city, country, propertyType, description,
 *         totalPropertyValue, annualYield, yearBuilt, totalSqft }
 *
 * Returns: { success: true, imageUrl: string, imageBase64: string, prompt: string }
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
    const prompt = buildImagePrompt(body);

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9", // Landscape — ideal for property/architecture
          imageSize: "1K",
        },
      },
    });

    // Extract image from response
    let imageBase64 = "";
    let mimeType = "image/png";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        imageBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No image returned from Gemini. Try adjusting the property description." },
        { status: 500 }
      );
    }

    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      imageBase64,
      mimeType,
      prompt,
    });
  } catch (err: any) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err.message || "Image generation failed" },
      { status: 500 }
    );
  }
}

/**
 * Builds a luxury real-estate photography prompt from property metadata.
 */
function buildImagePrompt(data: Record<string, any>): string {
  const name = data.name || "Luxury Property";
  const city = data.city || "";
  const country = data.country || "";
  const propertyType = data.propertyType || "residential";
  const description = data.description || "";
  const yearBuilt = data.yearBuilt || "";
  const totalSqft = data.totalSqft || "";

  const typeMap: Record<string, string> = {
    residential: "modern luxury residential tower, floor-to-ceiling windows, warm interior glow at dusk, landscaped gardens",
    commercial: "sleek commercial office building, glass curtain wall facade, corporate elegance, street-level retail",
    mixed: "mixed-use development with retail podium and residential tower, vibrant street life, contemporary architecture",
    industrial: "premium industrial warehouse conversion, exposed steel and brick, modern loft aesthetic, creative workspace",
    retail: "high-end retail precinct, designer storefronts, premium shopping boulevard, luxury brand aesthetic",
    hotel: "five-star hotel and resort, grand entrance, infinity pool, tropical luxury, golden hour",
    land: "panoramic aerial view of premium development site, city skyline backdrop, future potential",
  };

  const styleDesc = typeMap[propertyType] || typeMap.residential;

  const location = [city, country].filter(Boolean).join(", ");

  return [
    `Professional architectural photography of "${name}"${yearBuilt ? `, built ${yearBuilt}` : ""}.`,
    `${styleDesc}.`,
    location ? `Located in ${location}, showing local architectural character and skyline.` : "",
    totalSqft ? `${totalSqft} square feet of premium space.` : "",
    description ? `${description.substring(0, 200)}.` : "",
    `Golden hour lighting, dramatic sky, ultra-wide architectural lens, luxury real estate marketing photography.`,
    `Photorealistic, editorial quality, high-end property magazine style.`,
  ].filter(Boolean).join(" ");
}
