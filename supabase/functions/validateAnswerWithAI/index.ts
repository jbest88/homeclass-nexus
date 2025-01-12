import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Format answers for the prompt
    const userAnswersStr = Array.isArray(userAnswers) ? userAnswers.join(', ') : userAnswers;
    const correctAnswersStr = Array.isArray(correctAnswers) ? correctAnswers.join(', ') : correctAnswers;

    const prompt = `Evaluate this answer:

Question: "${question}"
Student's answer(s): ${userAnswersStr}
Correct answer(s): ${correctAnswersStr}

First, determine if the student's answer is completely correct.
Then, provide a very brief explanation (1-2 sentences) if incorrect.

Respond in this exact format:
CORRECT: [true/false]
EXPLANATION: [only if incorrect, otherwise leave blank]`;

    console.log('Sending prompt to Gemini:', prompt);

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
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    const aiResponse = data.candidates[0].content.parts[0].text.trim();
    
    // Parse the AI response
    const correctMatch = aiResponse.match(/CORRECT:\s*(true|false)/i);
    const explanationMatch = aiResponse.match(/EXPLANATION:\s*(.+)/i);
    
    const isCorrect = correctMatch ? correctMatch[1].toLowerCase() === 'true' : false;
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';

    return new Response(
      JSON.stringify({ 
        isCorrect,
        explanation,
        aiResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in validateAnswerWithAI:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});