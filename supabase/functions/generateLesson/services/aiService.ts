
export type AIProvider = 'gemini-2.5-pro-exp-03-25';

export async function generateWithAI(prompt: string, provider: AIProvider = 'gemini-2.5-pro-exp-03-25'): Promise<string> {
  try {
    console.log(`Generating with ${provider}...`);
    console.log('Prompt:', prompt);

    return await generateWithGemini(prompt);
  } catch (error) {
    console.error(`Error in ${provider} generation:`, error);
    throw error;
  }
}

async function generateWithGemini(prompt: string): Promise<string> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const maxRetries = 3;
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} of ${maxRetries} to call Gemini API`);
      
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent?key=${geminiApiKey}`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
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
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API error response (Attempt ${retries + 1}):`, errorText);
          
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            // These status codes indicate temporary issues, so we should retry
            retries++;
            
            // Add exponential backoff
            const delay = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
            console.log(`Retrying after ${delay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.error('Unexpected Gemini API response format:', data);
          throw new Error('Invalid response format from Gemini API');
        }

        console.log('Successfully received response from Gemini API');
        return data.candidates[0].content.parts[0].text;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error(`Error on attempt ${retries + 1}:`, error);
      lastError = error;
      
      // If it's a timeout error, retry
      if (error.name === 'AbortError') {
        console.log('Request timed out, retrying...');
        retries++;
        
        if (retries >= maxRetries) {
          console.error(`Failed after ${maxRetries} attempts due to timeout`);
          throw new Error('Request timed out after multiple attempts');
        }
        
        // Add exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        console.log(`Retrying after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's a specific error we want to retry
      if (error.message && (
          error.message.includes('502') || 
          error.message.includes('503') || 
          error.message.includes('504') || 
          error.message.includes('timeout'))) {
        retries++;
        
        if (retries >= maxRetries) {
          console.error(`Failed after ${maxRetries} attempts`);
          break;
        }
        
        // Add exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        console.log(`Retrying after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error('Failed to generate content after multiple attempts');
}
