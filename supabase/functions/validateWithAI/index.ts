import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGeminiAPI(prompt: string) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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