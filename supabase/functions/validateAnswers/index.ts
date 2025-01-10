import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { question, userAnswer, correctAnswer } = await req.json();
    console.log('Validating answer:', { question, userAnswer, correctAnswer });

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
      console.error('Gemini API error:', await response.text());
      throw new Error('Failed to validate answer');
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    console.log('Parsed result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in validateAnswers function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        isCorrect: false,
        explanation: 'Sorry, we encountered an error while validating your answer. Please try again.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});