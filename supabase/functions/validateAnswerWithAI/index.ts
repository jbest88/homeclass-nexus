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
    console.log('Validating answer:', { question, userAnswers, correctAnswers, type });

    // Format answers for display
    const userAnswersStr = Array.isArray(userAnswers) 
      ? userAnswers.join(", ") 
      : userAnswers;

    const prompt = `You are an expert teacher evaluating a student's answer. I will provide you with a question and the student's answer in JSON format. Please analyze if the answer is correct and provide an explanation.

Input JSON:
{
  "question": "${question}",
  "studentAnswer": "${userAnswersStr}",
  "questionType": "${type}",
  "correctAnswer": "${Array.isArray(correctAnswers) ? correctAnswers.join(", ") : correctAnswers}"
}

For mathematical questions:
1. Parse numerical expressions carefully
2. Consider equivalent forms (e.g., -8 and -8.0 are the same)
3. Handle negative numbers and decimals properly
4. Show step-by-step solution in explanation

Respond with a JSON object in this exact format:
{
  "isCorrect": true/false,
  "explanation": "Your explanation here"
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('Sending prompt to Gemini:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);

    // Parse the JSON response
    try {
      const jsonResponse = JSON.parse(text);
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
      throw new Error("Invalid response format from AI");
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