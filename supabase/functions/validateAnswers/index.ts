import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  question: string;
  userAnswer: string | string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  type: 'text' | 'multiple-choice' | 'multiple-answer';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userAnswer, correctAnswer, correctAnswers, type } = await req.json() as ValidationRequest;
    console.log('Validating answer:', { question, userAnswer, correctAnswer, correctAnswers, type });

    let isCorrect = false;
    let explanation = '';

    switch (type) {
      case 'multiple-choice':
        // For multiple choice, compare the selected answer with the correct answer
        isCorrect = userAnswer === correctAnswer;
        explanation = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The correct answer is: ${correctAnswer}`;
        break;

      case 'multiple-answer':
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswers)) {
          throw new Error('Invalid answer format for multiple-answer question');
        }
        // For multiple answer, check if all correct answers are selected and no incorrect ones
        isCorrect = correctAnswers.length === userAnswer.length &&
          correctAnswers.every(answer => userAnswer.includes(answer));
        explanation = isCorrect 
          ? 'All correct answers selected!' 
          : `Incorrect. The correct answers were: ${correctAnswers.join(', ')}`;
        break;

      case 'text':
        // For text answers, do a case-insensitive comparison
        isCorrect = userAnswer.toString().toLowerCase().trim() === 
                   correctAnswer?.toLowerCase().trim();
        explanation = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The expected answer was: ${correctAnswer}`;
        break;

      default:
        throw new Error(`Unsupported question type: ${type}`);
    }

    console.log('Validation result:', { isCorrect, explanation });

    return new Response(
      JSON.stringify({ isCorrect, explanation }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in validateAnswers:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        isCorrect: false,
        explanation: 'Error validating answer'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});