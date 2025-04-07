
export type AIProvider = 'gemini-1.5-pro' | 'gemini-1.0-pro' | 'gemini-1.5-flash';

export async function generateWithAI(prompt: string, provider: AIProvider = 'gemini-1.5-pro'): Promise<string> {
  try {
    console.log(`Generating with ${provider}...`);
    console.log('Prompt:', prompt);

    return await generateWithGemini(prompt, provider);
  } catch (error) {
    console.error(`Error in ${provider} generation:`, error);
    throw error;
  }
}

async function generateWithGemini(prompt: string, provider: AIProvider): Promise<string> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const maxRetries = 3;
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} of ${maxRetries} to call Gemini API using model: ${provider}`);
      
      let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${provider}/generateContent?key=${geminiApiKey}`;
      
      console.log("Using endpoint:", endpoint);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
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
          
          if (response.status >= 500 && response.status < 600) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            continue;
          }
          
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response received from Gemini API", JSON.stringify(data).substring(0, 500) + "...");
        
        // Properly handle the response structure based on the actual API response
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && 
            data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
          
          const text = data.candidates[0].content.parts[0].text;
          if (text && text.trim() !== '') {
            console.log('Successfully received valid response from Gemini API');
            return text;
          } else {
            console.error('Empty text in Gemini API response');
            throw new Error('Empty text in Gemini API response');
          }
        } else {
          console.error('Invalid or unexpected response structure from Gemini API:', JSON.stringify(data));
          
          // Check for specific error types in the response
          if (data.error) {
            console.error('API error details:', data.error);
            throw new Error(data.error.message || 'API error without details');
          }
          
          throw new Error('Invalid response format from Gemini API');
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error(`Error on attempt ${retries + 1}:`, error);
      
      lastError = error;
      retries++;
      
      if (retries >= maxRetries) {
        console.error(`Failed after ${maxRetries} attempts with error:`, error);
        throw error;
      }
      
      // Add exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      console.log(`Retrying after ${delay}ms delay...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Failed to generate content after multiple attempts');
}
