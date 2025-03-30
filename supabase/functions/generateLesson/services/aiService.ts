
export type AIProvider = 'gemini' | 'deepseek' | 'gemini-pro' | 'gemini-2.5-pro' | 'openai';

export async function generateWithAI(prompt: string, provider: AIProvider = 'gemini', apiKey?: string): Promise<string> {
  try {
    console.log(`Generating with ${provider}...`);
    console.log('Prompt:', prompt);

    if (provider === 'openai') {
      return await generateWithOpenAI(prompt, apiKey);
    } else if (provider === 'gemini-2.5-pro') {
      return await generateWithGemini25Pro(prompt, apiKey);
    } else if (provider === 'gemini' || provider === 'gemini-pro') {
      return await generateWithGemini(prompt, apiKey);
    } else {
      return await generateWithDeepseek(prompt, apiKey);
    }
  } catch (error) {
    console.error(`Error in ${provider} generation:`, error);
    throw error;
  }
}

async function generateWithGemini(prompt: string, apiKey?: string): Promise<string> {
  // Use provided API key or fallback to environment variable
  const geminiApiKey = apiKey || Deno.env.get("GEMINI_API_KEY");
  
  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
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

async function generateWithGemini25Pro(prompt: string, apiKey?: string): Promise<string> {
  // Use provided API key or fallback to environment variable
  const geminiApiKey = apiKey || Deno.env.get("GEMINI_API_KEY");
  
  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    // Using standard endpoint instead of experimental one
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
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

async function generateWithDeepseek(prompt: string, apiKey?: string): Promise<string> {
  // Use provided API key or fallback to environment variable
  const deepseekApiKey = apiKey || Deno.env.get("DEEPSEEK_API_KEY");
  
  if (!deepseekApiKey) {
    throw new Error("DeepSeek API key is not configured");
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepseek API error response:', errorText);
      throw new Error(`Deepseek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected Deepseek API response format:', data);
      throw new Error('Invalid response format from Deepseek API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Deepseek API:', error);
    throw error;
  }
}

async function generateWithOpenAI(prompt: string, apiKey?: string): Promise<string> {
  // Use provided API key or fallback to environment variable
  const openAIApiKey = apiKey || Deno.env.get("OPENAI_API_KEY");
  
  if (!openAIApiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using the latest available model
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI API response format:', data);
      throw new Error('Invalid response format from OpenAI API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
