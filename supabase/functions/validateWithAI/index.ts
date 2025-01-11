import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userAnswer, correctAnswer, type, mode, correctAnswers } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw Gemini response:', data);

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response format:', data);
      throw new Error('Invalid Gemini response structure');
    }

    const responseText = data.candidates[0].content.parts[0].text.trim();
    console.log('Response text:', responseText);

    // Try to find a JSON object in the response
    let jsonMatch;
    try {
      // First try to parse the entire response as JSON
      jsonMatch = JSON.parse(responseText);
    } catch (e) {
      // If that fails, try to extract JSON from the text
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