import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userAnswer, correctAnswer, type, correctAnswers } = await req.json();
    console.log('Validating answer:', { question, userAnswer, type, correctAnswer });

    // Handle different question types
    if (type === 'multiple-choice') {
      const isCorrect = userAnswer === correctAnswer;
      let explanation = isCorrect 
        ? 'Correct!' 
        : `Incorrect. The correct answer is: ${correctAnswer}`;

      // Add additional explanation for mathematical questions if needed
      if (question.includes('Simplify') || question.includes('Calculate')) {
        explanation += isCorrect 
          ? ' Your understanding of the mathematical operation is correct.'
          : ' Remember to carefully follow the order of operations and calculate step by step.';
      }

      return new Response(
        JSON.stringify({ isCorrect, explanation }),
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

    // For text answers, use simple string comparison
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    return new Response(
      JSON.stringify({
        isCorrect,
        explanation: isCorrect 
          ? 'Correct!' 
          : `Incorrect. The expected answer was: ${correctAnswer}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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