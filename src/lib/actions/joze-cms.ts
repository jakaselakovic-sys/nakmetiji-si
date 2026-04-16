"use server";

import Groq from "groq-sdk";

// Helper to ensure Groq is available on the server
function getGroq(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("[Jože CMS] GROQ_API_KEY is not set.");
  }
  return new Groq({ apiKey });
}

const MODEL = "llama-3.3-70b-versatile";

/**
 * enhanceDraft: Takes rough user input (HTML or Text) and "Apple-ifys" it
 * using Jože's premium, warm, authentically Slovenian persona.
 */
export async function enhanceDraft(draftText: string): Promise<string> {
  const groq = getGroq();
  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `You are Jože, the Master Copywriter and Ethnologist for NaKmetiji.si.
        Your task: Rewrite the provided rough sketch/draft into premium, warm, and highly engaging Slovenian prose ("Apple Tech, Slovenian Heart").
        
        Rules:
        - NEVER output markdown. Output clean HTML tags (only <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>).
        - DO NOT wrap the output in \`\`\`html or anything else. Just the raw HTML string.
        - Tone: Grounded, hospitable, uses sensory words (smell of fresh hay, warm bread). Avoid corporate jargon completely.
        - Flawless Slovenian grammar with correct diacritics (č, š, ž). Include a mild authentic proverb if appropriate.`
      },
      {
        role: "user",
        content: `Here is the rough draft, make it beautiful HTML:\n\n${draftText}`
      }
    ]
  });

  return response.choices[0]?.message?.content?.trim() || draftText;
}

/**
 * generateSEO: Analyzes finalized HTML content and outputs structured JSON
 * containing focus keywords, meta descriptions, and OG captions.
 */
export async function generateSEO(title: string, contentHtml: string) {
  const groq = getGroq();
  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.3, // Lower temp for structured output
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an SEO Automator. You must analyze the title and content provided and output ONLY a valid JSON object with the following schema:
        {
          "focus_keywords": ["keyword1", "keyword2", "keyword3"],
          "meta_description": "A compelling 150-160 character description optimized for Google search.",
          "og_caption": "A 1-2 sentence compelling summary for sharing on Facebook/Instagram."
        }`
      },
      {
        role: "user",
        content: `Title: ${title}\n\nContent:\n${contentHtml}`
      }
    ]
  });

  const payload = response.choices[0]?.message?.content;
  if (!payload) throw new Error("No SEO data generated.");
  return JSON.parse(payload);
}
