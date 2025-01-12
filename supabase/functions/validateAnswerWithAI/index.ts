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
    console.log('Validating answer:', { question, userAnswers, type });

    // Format answers for display
    const userAnswersStr = Array.isArray(userAnswers) 
      ? userAnswers.join(", ") 
      : userAnswers;

    const prompt = `You are an expert teacher evaluating a student's answer.

Question: "${question}"
Student's answer: "${userAnswersStr}"

Your task:
1. Determine if the student's answer is EXACTLY correct (case-insensitive)
2. If incorrect, provide a brief, encouraging explanation

Important: The answer must match EXACTLY to be considered correct (ignoring case).

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

    // Compare the answers directly (case-insensitive)
    const normalizedUserAnswer = String(userAnswersStr).toLowerCase().trim();
    const normalizedCorrectAnswer = Array.isArray(correctAnswers) 
      ? correctAnswers.map(a => String(a).toLowerCase().trim())
      : String(correctAnswers).toLowerCase().trim();

    // Direct comparison
    const isExactMatch = Array.isArray(normalizedCorrectAnswer)
      ? normalizedCorrectAnswer.length === (Array.isArray(userAnswers) ? userAnswers.length : 1) &&
        normalizedCorrectAnswer.every(correct => 
          Array.isArray(userAnswers) 
            ? userAnswers.map(a => String(a).toLowerCase().trim()).includes(correct)
            : normalizedUserAnswer === correct
        )
      : normalizedUserAnswer === normalizedCorrectAnswer;

    // Use exact match for final validation
    const isCorrect = isExactMatch;
    const explanation = !isCorrect && explanationMatch ? explanationMatch[1].trim() : '';

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
    console.error("Error in validateAnswerWithAI:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to validate answer",
        isCorrect: false,
        explanation: `Error validating answer: ${error.message}`
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});