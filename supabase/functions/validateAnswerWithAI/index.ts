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

    // Construct the prompt based on the question type
    let prompt = '';
    if (type === 'multiple-answer') {
      const userAnswersStr = Array.isArray(userAnswers) ? userAnswers.join(', ') : userAnswers;
      prompt = `Question: "${question}"
User selected answers: ${userAnswersStr}
Expected correct answers: ${Array.isArray(correctAnswers) ? correctAnswers.join(', ') : correctAnswers}

Please analyze if the user's selected answers are correct for this question. Consider the following:
1. For questions about shapes, validate based on geometric properties
2. For numerical comparisons, check if all numbers meet the criteria
3. For general knowledge questions, verify accuracy of all selected options

Respond with ONLY "YES" if the answer is completely correct, or "NO" if it's incorrect or partially correct. No other text.`;
    } else {
      prompt = `Question: "${question}"
User answer: ${userAnswers}
Expected answer: ${correctAnswers}

Is the user's answer correct? Consider context and variations in expressing the same concept.
Respond with ONLY "YES" if correct or "NO" if incorrect. No other text.`;
    }

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
            maxOutputTokens: 1,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    const aiResponse = data.candidates[0].content.parts[0].text.trim().toUpperCase();
    const isCorrect = aiResponse === 'YES';

    return new Response(
      JSON.stringify({ 
        isCorrect,
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