export type AIProvider = 'gemini' | 'deepseek' | 'gemini-pro' | 'gemini-2.5-pro-exp-03-25' | 'openai';

export async function generateWithAI(prompt: string, provider: AIProvider = 'gemini', apiKey?: string): Promise<string> {
  try {
    console.log(`Generating with ${provider}...`);
    console.log('Prompt:', prompt);

    if (provider === 'openai') {
      return await generateWithOpenAI(prompt, apiKey);
    } else if (provider === 'gemini-2.5-pro-exp-03-25' || provider === 'gemini' || provider === 'gemini-pro') {
      return await generateWithGemini(prompt, apiKey, provider);
    } else {
      return await generateWithDeepseek(prompt, apiKey);
    }
  } catch (error) {
    console.error(`Error in ${provider} generation:`, error);
    throw error;
  }
}

async function generateWithGemini(prompt: string, apiKey?: string, model: string = 'gemini-2.5-pro-exp-03-25'): Promise<string> {
  const geminiApiKey = apiKey || Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected Gemini API response format:', data);
      throw new Error('Invalid response format from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
