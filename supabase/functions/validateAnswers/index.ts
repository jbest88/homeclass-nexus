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

    const { question, userAnswer, correctAnswer, type, correctAnswers, lessonContent } = await req.json();
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
      You are an educational answer validator. Your task is to evaluate if a student's answer demonstrates understanding of the concept based on the lesson content provided.

      Lesson Content:
      "${lessonContent}"

      Question: "${question}"
      Student's Answer: "${userAnswer}"
      Expected Answer: "${correctAnswer}"

      Important Guidelines:
      1. The student's answer should be considered correct if it demonstrates understanding of the concept, even if the wording is different.
      2. Look for key concepts from the lesson content that match between the student's answer and the expected answer.
      3. Be lenient with minor differences in wording or phrasing.
      4. Focus on the core meaning and understanding rather than exact matches.

      Return ONLY a JSON object with these exact fields:
      {
        "isCorrect": boolean (true if the answer demonstrates understanding),
        "explanation": string (if correct: praise the answer, if incorrect: explain what was missing or incorrect)
      }
    `;

    console.log('Sending prompt to Gemini:', prompt);

    try {
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