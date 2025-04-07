
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.1.0";

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

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" });

    // Format answers for display
    const userAnswersStr = Array.isArray(userAnswers) 
      ? userAnswers.join(", ") 
      : userAnswers;

    const prompt = `You are an expert teacher evaluating a student's answer. You must respond with a JSON object containing exactly two fields: "isCorrect" (boolean) and "explanation" (string).

Question: "${question}"
Student's answer: "${userAnswersStr}"
Type: ${type}
Correct answer(s): ${Array.isArray(correctAnswers) ? correctAnswers.join(", ") : correctAnswers}

For mathematical questions:
1. Parse numerical expressions carefully
2. Consider equivalent forms (e.g., -8 and -8.0 are the same)
3. Handle negative numbers and decimals properly
4. Show step-by-step solution in explanation

Your response must be a valid JSON object with this exact format:
{
  "isCorrect": true/false,
  "explanation": "Your explanation here"
}

Do not include any other text before or after the JSON object.`;

    console.log('Sending prompt to Gemini 2.5:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);

    // Try to parse the JSON response
    try {
      // Clean the response text to ensure it only contains the JSON object
      const cleanedText = text.trim().replace(/```json\n?|\n?```/g, '');
      const jsonResponse = JSON.parse(cleanedText);

      // Validate the response structure
      if (typeof jsonResponse.isCorrect !== 'boolean' || typeof jsonResponse.explanation !== 'string') {
        throw new Error('Response missing required fields');
      }

      console.log('Parsed response:', jsonResponse);

      return new Response(
        JSON.stringify(jsonResponse),
        {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
        }
      );
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      console.error('Raw response:', text);
      
      // Attempt to extract information from non-JSON response
      const isCorrect = text.toLowerCase().includes('correct') && !text.toLowerCase().includes('incorrect');
      const explanation = "The answer was " + (isCorrect ? "correct" : "incorrect") + ". Please try again.";
      
      return new Response(
        JSON.stringify({ isCorrect, explanation }),
        {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
        }
      );
    }
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
