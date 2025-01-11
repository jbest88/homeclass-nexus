import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

async function callGeminiAPI(prompt: string, retries = 3) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt} - Calling Gemini API with prompt:`, prompt);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

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
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (attempt ${attempt}):`, errorText);
        throw new Error(`Gemini API error: ${errorText}`);
      }

      const result = await response.json();
      console.log('Gemini API response:', result);
      return result;

    } catch (error) {
      console.error(`Error in attempt ${attempt}:`, error);
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log('Request timed out, retrying...');
      }
      
      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Received request to validateWithAI');
    const { question, userAnswer, correctAnswer, type, mode, correctAnswers } = await req.json();

    let prompt;
    let responseFormat;

    if (mode === 'validate_question') {
      prompt = `You are an experienced educator carefully validating an educational question. Take your time to thoroughly analyze every aspect of this question:

      Question to validate: "${question}"
      Question type: ${type}
      Provided correct answer: ${JSON.stringify(correctAnswer)}
      ${type === 'multiple-answer' ? `Correct answers: ${JSON.stringify(correctAnswers)}` : ''}
      
      Please perform a detailed analysis considering:
      1. Clarity and Precision:
         - Is the question clearly worded without any ambiguity?
         - Are all terms used appropriate for the question type?
         - Would a student understand exactly what is being asked?
      
      2. Answer Validation:
         - Is the provided correct answer truly accurate?
         - Is it properly formatted for the question type?
         - Are there any potential issues with the answer format?
      
      3. Educational Value:
         - Does the question serve a clear educational purpose?
         - Is it appropriate for testing understanding?
         - Does it avoid relying on external context?
      
      4. Technical Correctness:
         - Is the question type appropriate for the content?
         - Are all technical aspects (formatting, structure) correct?
         - For multiple choice/answer questions, are options distinct and clear?
      
      Take time to consider each aspect carefully before making your decision.
      
      Return ONLY a JSON object in this exact format, with no additional text:
      {
        "isValid": true/false,
        "explanation": "detailed explanation of validation result",
        "suggestedCorrection": "correction suggestion if not valid, empty string if valid"
      }`;

      responseFormat = {
        isValid: "boolean",
        explanation: "string",
        suggestedCorrection: "string"
      };
    } else {
      prompt = `You are an experienced educator evaluating a student's answer. Take your time to thoroughly analyze their response:
      
      Question: "${question}"
      Question type: ${type}
      Student's answer: ${JSON.stringify(userAnswer)}
      Expected answer: ${JSON.stringify(correctAnswer)}
      ${type === 'multiple-answer' ? `Correct answers: ${JSON.stringify(correctAnswers)}` : ''}
      
      Please perform a detailed analysis considering:
      1. Core Understanding:
         - Does the answer demonstrate understanding of the key concept?
         - Are there signs of partial understanding?
      
      2. Accuracy:
         - Is the answer technically correct?
         - Are there minor variations that could still be valid?
      
      3. Completeness:
         - Does the answer fully address the question?
         - For multiple parts, are all components addressed?
      
      Take time to consider each aspect carefully before making your decision.
      
      Return ONLY a JSON object in this exact format, with no additional text:
      {
        "isCorrect": true/false,
        "explanation": "detailed feedback explaining the evaluation"
      }`;

      responseFormat = {
        isCorrect: "boolean",
        explanation: "string"
      };
    }

    console.log('Sending prompt to Gemini:', prompt);

    const result = await callGeminiAPI(prompt);
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
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
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