
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    // Get the default API key from environment, or use the provided one
    let geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    const { subject, model = 'gemini-1.0-pro', apiKey } = await req.json();
    
    // Use provided API key if available
    if (apiKey) {
      geminiApiKey = apiKey;
      console.log('Using API key provided by client');
    } else if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set and no API key provided by client');
      throw new Error('API key is not configured');
    }
    
    console.log(`Generating learning plan for subject: ${subject} using model: ${model}`);

    const prompt = `Create a detailed learning plan for ${subject}. Include key topics, recommended resources, and estimated time frames.`;

    // Use the standard API endpoint format with the specified model
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiApiKey}`;
    
    console.log(`Using API endpoint: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
