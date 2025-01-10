import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { question, userAnswer, correctAnswer } = await req.json();

    const prompt = `
      Question: "${question}"
      Correct answer: "${correctAnswer}"
      Student's answer: "${userAnswer}"
      
      Is the student's answer correct? Consider semantic meaning rather than exact wording.
      Respond with a JSON object containing:
      {
        "isCorrect": boolean,
        "explanation": "Brief explanation of why the answer is correct or incorrect"
      }
      Only return the JSON, no other text.
    `;

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate answer');
    }

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});