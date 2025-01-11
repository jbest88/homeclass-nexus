import { corsHeaders } from './utils.ts';
import { GeminiResponse } from './types.ts';

export const generateWithGemini = async (
  apiKey: string,
  prompt: string,
  retries = 3
): Promise<string> => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt} - Calling Gemini API`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (attempt ${attempt}):`, errorText);
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          console.log('Rate limit hit, waiting before retry...');
          // Wait longer for rate limit errors
          if (attempt < retries) {
            const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          throw new Error('Rate limit exceeded');
        }
        
        throw new Error(`Generation failed: ${errorText}`);
      }

      const data = await response.json() as GeminiResponse;
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Unexpected response format:', data);
        throw new Error('Invalid response format from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;

    } catch (error) {
      console.error(`Error in attempt ${attempt}:`, error);
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      }
      
      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError;
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};