import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

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
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { subject } = await req.json();
    console.log('Generating learning plan for subject:', subject);

    const prompt = `Create a detailed learning plan for ${subject}. Include key topics, recommended resources, and estimated time frames.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
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
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');

    if (!data.candidates || data.candidates.length === 0) {
      console.error('Invalid response format from Gemini API:', data);
      throw new Error('Invalid response format from Gemini API');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generateLearningPlan function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});