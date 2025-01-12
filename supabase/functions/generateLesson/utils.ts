import { GeminiResponse } from "./types.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const generateWithGemini = async (
  apiKey: string,
  prompt: string
): Promise<string> => {
  console.log('Sending request to Gemini API with prompt:', prompt);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Generation failed: ${errorText}`);
    }

    const data = await response.json() as GeminiResponse;
    console.log('Received response from Gemini API:', JSON.stringify(data, null, 2));
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected Gemini API response format:', data);
      throw new Error('Invalid response format from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Successfully extracted generated text:', generatedText.substring(0, 100) + '...');
    
    return generatedText;
  } catch (error) {
    console.error('Error in generateWithGemini:', error);
    throw error;
  }
};

export const getCurriculumPeriod = (date: string): string => {
  const month = new Date(date).getMonth() + 1; // getMonth() returns 0-11
  
  if (month >= 9 && month <= 12) return "Fall Semester";
  if (month >= 1 && month <= 3) return "Winter Term";
  if (month >= 4 && month <= 5) return "Spring Semester";
  return "Summer Term";
};