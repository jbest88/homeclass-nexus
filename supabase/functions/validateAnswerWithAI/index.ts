import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.1.0";

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userAnswers, correctAnswers, type } = await req.json();
    console.log('Validating answer:', { question, userAnswers, correctAnswers, type });

    // Format answers for display
    const userAnswersStr = Array.isArray(userAnswers) 
      ? userAnswers.join(", ") 
      : userAnswers;

    const prompt = `You are an expert teacher evaluating a student's answer.

Question: "${question}"
Student's answer: "${userAnswersStr}"
Type: ${type}
Correct answer(s): ${Array.isArray(correctAnswers) ? correctAnswers.join(", ") : correctAnswers}

Your task:
1. For multiple-answer questions, the student's answer is correct if ALL selected answers are valid for the question, regardless of whether they selected all possible correct answers.
2. For other question types, determine if the student's answer matches exactly (case-insensitive).
3. If incorrect, provide a brief, encouraging explanation.

Respond in this exact format:
CORRECT: [true/false]
EXPLANATION: [only if incorrect, otherwise leave blank]`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('Sending prompt to Gemini:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);

    // Parse the AI response
    const correctMatch = text.match(/CORRECT:\s*(true|false)/i);
    const explanationMatch = text.match(/EXPLANATION:\s*(.+)/i);

    if (!correctMatch) {
      console.error('Could not parse AI response for correctness');
      throw new Error("Could not parse AI response for correctness");
    }

    const isCorrect = correctMatch[1].toLowerCase() === 'true';
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';

    console.log('Validation result:', { isCorrect, explanation });

    return new Response(
      JSON.stringify({ isCorrect, explanation }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error('Error in validateAnswerWithAI function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        isCorrect: false,
        explanation: `Error validating answer: ${error.message}`
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 400,
      }
    );
  }
});