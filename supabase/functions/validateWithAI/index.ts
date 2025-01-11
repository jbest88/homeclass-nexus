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
    const { question, userAnswer, correctAnswer, type, mode } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    let prompt;
    if (mode === 'validate_question') {
      prompt = `You are a teacher validating a question for a student. 
      Please analyze this question and its provided correct answer:
      
      Question: "${question}"
      Type: ${type}
      Provided correct answer: ${JSON.stringify(correctAnswer)}
      
      Validate if:
      1. The question is clear and unambiguous
      2. The correct answer is truly correct
      3. The question type is appropriate
      4. The question doesn't rely on external context
      
      Return a JSON response with:
      {
        "isValid": boolean,
        "explanation": string (why it's valid or not),
        "suggestedCorrection": string (if not valid)
      }`;
    } else {
      prompt = `You are a teacher evaluating a student's answer.
      
      Question: "${question}"
      Type: ${type}
      Student's answer: ${JSON.stringify(userAnswer)}
      Expected answer: ${JSON.stringify(correctAnswer)}
      
      Evaluate if the student's answer is correct, considering:
      1. The core concept being tested
      2. Possible alternative correct answers
      3. Partial understanding
      
      Return a JSON response with:
      {
        "isCorrect": boolean,
        "explanation": string (detailed feedback for the student),
        "suggestedImprovement": string (if incorrect)
      }`;
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
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI validation failed:', errorText);
      throw new Error(`AI validation failed: ${errorText}`);
    }

    const data = await response.json();
    let result;
    
    try {
      result = JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
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