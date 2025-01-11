import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple request queue to prevent overwhelming the API
const requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Error processing queued request:', error);
      }
      // Add a small delay between processing queue items
      await sleep(500);
    }
  }

  isProcessing = false;
}

async function callGeminiWithRetry(prompt: string, maxRetries = 5) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff with additional random delay to prevent thundering herd
      const backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt + 1}, waiting ${backoffTime}ms`);
        await sleep(backoffTime);
      }

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ 
                text: prompt 
              }] 
            }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.1,
              topK: 16,
            }
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Rate limit hit on attempt ${attempt + 1}`);
        if (attempt === maxRetries - 1) {
          throw new Error('Rate limit exceeded after all retry attempts. Please try again in a few minutes.');
        }
        // Add increasingly longer delays for rate limit errors
        await sleep(Math.pow(2, attempt + 1) * 2000);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userAnswer, correctAnswer, type, mode, correctAnswers } = await req.json();

    let prompt;
    let responseFormat;

    if (mode === 'validate_question') {
      prompt = `You are a teacher validating a question for a student. 
      Please analyze this question and its provided correct answer:
      
      Question: "${question}"
      Type: ${type}
      Provided correct answer: ${JSON.stringify(correctAnswer)}
      ${type === 'multiple-answer' ? `Correct answers: ${JSON.stringify(correctAnswers)}` : ''}
      
      Validate if:
      1. The question is clear and unambiguous
      2. The correct answer is truly correct and properly formatted
      3. The question type is appropriate
      4. The question doesn't rely on external context
      
      Return ONLY a JSON object in this exact format, with no additional text:
      {
        "isValid": true/false,
        "explanation": "explanation string",
        "suggestedCorrection": "correction string if not valid, empty string if valid"
      }`;

      responseFormat = {
        isValid: "boolean",
        explanation: "string",
        suggestedCorrection: "string"
      };
    } else {
      prompt = `You are a teacher evaluating a student's answer.
      
      Question: "${question}"
      Type: ${type}
      Student's answer: ${JSON.stringify(userAnswer)}
      Expected answer: ${JSON.stringify(correctAnswer)}
      ${type === 'multiple-answer' ? `Correct answers: ${JSON.stringify(correctAnswers)}` : ''}
      
      Evaluate if the student's answer is correct, considering:
      1. The core concept being tested
      2. Possible alternative correct answers
      3. Partial understanding
      
      Return ONLY a JSON object in this exact format, with no additional text:
      {
        "isCorrect": true/false,
        "explanation": "detailed feedback string"
      }`;

      responseFormat = {
        isCorrect: "boolean",
        explanation: "string"
      };
    }

    console.log('Sending prompt to Gemini:', prompt);

    // Add request to queue
    let result: any;
    await new Promise((resolve, reject) => {
      requestQueue.push(async () => {
        try {
          result = await callGeminiWithRetry(prompt);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      processQueue();
    });

    console.log('Raw Gemini response:', result);

    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response format:', result);
      throw new Error('Invalid Gemini response structure');
    }

    const responseText = result.candidates[0].content.parts[0].text.trim();
    console.log('Response text:', responseText);

    let jsonMatch;
    try {
      jsonMatch = JSON.parse(responseText);
    } catch (e) {
      const matches = responseText.match(/\{[\s\S]*\}/);
      if (!matches) {
        console.error('No JSON found in response:', responseText);
        throw new Error('No JSON found in response');
      }
      jsonMatch = JSON.parse(matches[0]);
    }

    // Ensure all required fields are present and have correct types
    for (const [key, expectedType] of Object.entries(responseFormat)) {
      if (!(key in jsonMatch)) {
        jsonMatch[key] = expectedType === "boolean" ? false : 
                        expectedType === "string" ? "" : null;
      }
      if (typeof jsonMatch[key] !== expectedType) {
        if (expectedType === "string" && jsonMatch[key] === null) {
          jsonMatch[key] = "";
        } else if (expectedType === "boolean" && typeof jsonMatch[key] !== "boolean") {
          jsonMatch[key] = false;
        } else {
          console.error(`Invalid type for ${key}:`, typeof jsonMatch[key], 'expected:', expectedType);
          throw new Error(`Invalid response format: ${key} should be ${expectedType}`);
        }
      }
    }

    return new Response(
      JSON.stringify(jsonMatch),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validateWithAI:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});