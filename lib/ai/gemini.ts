import "server-only";

const DEFAULT_MODEL = "gemini-2.0-flash";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}
