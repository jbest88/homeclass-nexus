
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

  const maxRetries = 5; // Increase from 3 to 5
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} of ${maxRetries} to call Gemini API`);
      
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro/generateContent?key=${geminiApiKey}`;
      
      console.log("Using endpoint:", endpoint);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000); // 45 second timeout (shorter than client timeout)
      
      try {
        console.log("Sending request to Gemini API...");
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
          console.error(`Gemini API error response (Attempt ${retries + 1}):`, 
                        `Status: ${response.status} ${response.statusText}`, 
                        `Body: ${errorText}`);
          
          // Always retry 502, 503, 504 errors regardless of retry count
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            retries++;
            
            // Add exponential backoff with jitter
            const baseDelay = Math.pow(2, retries) * 1000; // 2s, 4s, 8s, etc.
            const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
            const delay = baseDelay + jitter;
            console.log(`Gateway error received (${response.status}). Retrying after ${delay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          if (response.status === 429) {
            throw new Error("API quota exceeded or rate limited");
          }
          
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response received from Gemini API", JSON.stringify(data).substring(0, 500) + "...");
        
        if (!data.candidates || data.candidates.length === 0) {
          console.error('Empty candidates array in Gemini API response:', JSON.stringify(data));
          
          // Try with a different model
          retries++;
          if (retries < maxRetries) {
            console.log("Retrying with a different model endpoint...");
            // Switch to the standard Gemini 1.0 Pro model
            const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${geminiApiKey}`;
            
            const fallbackResponse = await fetch(fallbackEndpoint, {
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
                }
              })
            });
            
            if (!fallbackResponse.ok) {
              console.error("Fallback model also failed");
              throw new Error("Failed to generate content with both primary and fallback models");
            }
            
            const fallbackData = await fallbackResponse.json();
            
            if (!fallbackData.candidates || fallbackData.candidates.length === 0) {
              throw new Error('No content generated by either Gemini model');
            }
            
            console.log('Successfully received valid response from fallback Gemini model');
            return fallbackData.candidates[0].content.parts[0].text;
          }
          
          throw new Error('No content generated by Gemini API');
        }
        
        if (!data.candidates[0]?.content?.parts || data.candidates[0].content.parts.length === 0) {
          console.error('Invalid response structure from Gemini API:', JSON.stringify(data));
          throw new Error('Invalid response format from Gemini API');
        }
        
        if (!data.candidates[0].content.parts[0].text) {
          console.error('No text in Gemini API response:', JSON.stringify(data));
          throw new Error('No text content in Gemini API response');
        }

        console.log('Successfully received valid response from Gemini API');
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
        
        // Add exponential backoff with jitter
        const baseDelay = Math.pow(2, retries) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        console.log(`Retrying after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's a specific error we want to retry
      if (error.message && (
          error.message.includes('502') || 
          error.message.includes('503') || 
          error.message.includes('504') || 
          error.message.includes('timeout') ||
          error.message.includes('Gateway'))) {
        retries++;
        
        if (retries >= maxRetries) {
          console.error(`Failed after ${maxRetries} attempts`);
          throw new Error(`Service temporarily unavailable after ${maxRetries} attempts`);
        }
        
        // Add exponential backoff with jitter
        const baseDelay = Math.pow(2, retries) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
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
