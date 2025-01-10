import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { question, userAnswer, correctAnswer, type, correctAnswers } = await req.json();
    console.log('Validating answer:', { question, userAnswer, type, correctAnswer });

    // Handle different question types
    if (type === 'multiple-choice') {
      const isCorrect = userAnswer === correctAnswer;
      return new Response(
        JSON.stringify({
          isCorrect,
          explanation: isCorrect ? 'Correct!' : `Incorrect. The correct answer was: ${correctAnswer}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'multiple-answer') {
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const isCorrect = correctAnswers.length === userAnswers.length &&
        correctAnswers.every(answer => userAnswers.includes(answer));
      
      return new Response(
        JSON.stringify({
          isCorrect,
          explanation: isCorrect 
            ? 'All correct answers selected!' 
            : `Incorrect. The correct answers were: ${correctAnswers.join(', ')}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For text answers, use Gemini API to check semantic meaning
    const prompt = `
      Question: "${question}"
      Student's Answer: "${userAnswer}"
      Correct Answer: "${correctAnswer}"

      Evaluate if the student's answer is correct, considering semantic meaning rather than exact wording.
      Return a JSON object with:
      1. "isCorrect": boolean indicating if the answer is correct
      2. "explanation": string explaining why the answer is correct or incorrect
      
      Format the response as valid JSON.
    `;

    console.log('Sending prompt to Gemini:', prompt);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${geminiApiKey}`,
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
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API response:', JSON.stringify(data, null, 2));

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Invalid Gemini API response format:', data);
        throw new Error('Invalid response format from Gemini API');
      }

      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      console.log('Parsed validation result:', result);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (geminiError) {
      console.error('Error with Gemini API:', geminiError);
      // Return a more graceful response for Gemini API errors
      return new Response(
        JSON.stringify({
          isCorrect: false,
          explanation: "We couldn't automatically validate your answer. Please try again or contact support if the issue persists."
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Return 200 to avoid client-side errors
        }
      );
    }

  } catch (error) {
    console.error('Error in validateAnswers function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        isCorrect: false,
        explanation: 'Sorry, we encountered an error while validating your answer. Please try again.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});