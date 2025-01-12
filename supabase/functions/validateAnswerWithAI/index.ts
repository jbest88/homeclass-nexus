import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const { question, userAnswers, type } = await req.json();

    // Format user answers for display
    const userAnswersStr = Array.isArray(userAnswers) 
      ? userAnswers.join(", ") 
      : userAnswers;

    console.log('Validating answer:', { question, userAnswers, type });

    const prompt = `You are an expert teacher evaluating a student's answer.

Question: "${question}"
Student's answer(s): ${userAnswersStr}

Based on your expertise and understanding of the subject matter:
1. Determine if the student's answer is completely correct
2. If incorrect, provide a very brief explanation (1-2 sentences) to help the student understand why

Respond in this exact format:
CORRECT: [true/false]
EXPLANATION: [only if incorrect, otherwise leave blank]`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('AI Response:', text);

    // Parse the AI response
    const correctMatch = text.match(/CORRECT:\s*(true|false)/i);
    const explanationMatch = text.match(/EXPLANATION:\s*(.+)/i);

    if (!correctMatch) {
      throw new Error("Could not parse AI response for correctness");
    }

    const isCorrect = correctMatch[1].toLowerCase() === 'true';
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';

    // Return structured response
    const validationResponse = {
      isCorrect,
      explanation: isCorrect ? '' : explanation
    };

    console.log('Validation response:', validationResponse);

    return new Response(
      JSON.stringify(validationResponse),
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