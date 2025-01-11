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
      2. The correct answer is truly correct
      3. The question type is appropriate
      4. The question doesn't rely on external context
      
      Return ONLY a JSON response with this exact format:
      {
        "isValid": boolean,
        "explanation": string (why it's valid or not),
        "suggestedCorrection": string (if not valid)
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
      
      Return ONLY a JSON response with this exact format:
      {
        "isCorrect": boolean,
        "explanation": string (detailed feedback for the student)
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
      throw new Error('Invalid Gemini response format');
    }

    let result;
    try {
      const responseText = data.candidates[0].content.parts[0].text;
      // Extract JSON from the response text (in case there's additional text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      result = JSON.parse(jsonMatch[0]);
      
      // Validate the response format
      for (const [key, type] of Object.entries(responseFormat)) {
        if (typeof result[key] !== type) {
          throw new Error(`Invalid response format: ${key} should be ${type}`);
        }
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validateWithAI:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});