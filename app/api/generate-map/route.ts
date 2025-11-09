// app/api/generate-map/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

interface LearningNode {
  id: string;
  label: string;
  description: string;
  resources: Array<{ title: string; url: string; type: "article" | "video" | "book" }>;
  level: "Beginner" | "Intermediate" | "Advanced";
}

interface LearningMap {
  nodes: LearningNode[];
  edges: Array<{ source: string; target: string }>;
}

export async function GET() {
  return NextResponse.json({ message: "Gemini API ready" });
}

async function generateLearningMap(topic: string): Promise<LearningMap> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a learning map for "${topic} Explain about the "${topic} in description in short".

Return ONLY valid JSON in this format:
{
  "nodes": [
    {
      "id": "1",
      "label": "HTML",
      "description": "HTML is a..",
      "resources": [
        { "title": "MDN", "url": "https://...", "type": "article" }
      ],
      "level": "Beginner"
    }
  ],
  "edges": [{ "source": "1", "target": "2" }]
}

Rules:
- 3–8 nodes
- Real URLs (Articles, Docs, Youtube links)
- No markdown
- Valid JSON only`,
    config: {
      responseMimeType: "application/json", // Forces JSON
    },
  });

  const text = response.text;

  if (!text) throw new Error("No response from Gemini");

  // Clean JSON (remove ```json
  const jsonStr = text.trim().replace(/^```json\n|\n```$/g, "");

  return JSON.parse(jsonStr) as LearningMap;
}

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Valid 'topic' is required" },
        { status: 400 }
      );
    }

    const map = await generateLearningMap(topic);
    return NextResponse.json(map);
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate map" },
      { status: 500 }
    );
  }
}