import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.1.0";

interface AIResponse {
  text: string;
}

export type AIProvider = 'gemini' | 'deepseek';

export async function generateWithAI(
  prompt: string,
  provider: AIProvider = 'gemini',
  retryCount = 0
): Promise<string> {
  console.log(`Generating with ${provider}, attempt ${retryCount + 1}`);
  console.log('Prompt:', prompt);

  const maxRetries = 3;
  const baseDelay = 1000;

  try {
    let response: AIResponse;

    if (provider === 'gemini') {
      response = await generateWithGemini(prompt);
    } else {
      response = await generateWithDeepseek(prompt);
    }

    console.log('AI response:', response);
    return response.text;
  } catch (error) {
    console.error(`Error in ${provider} generation:`, error);

    if (error.message.includes('API quota exceeded') && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Rate limit hit, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateWithAI(prompt, provider, retryCount + 1);
    }

    throw error;
  }
}

async function generateWithGemini(prompt: string): Promise<AIResponse> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const result = await model.generateContent(prompt);
  return { text: result.response.text() };
}

async function generateWithDeepseek(prompt: string): Promise<AIResponse> {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();
  return { text: data.choices[0].message.content };
}