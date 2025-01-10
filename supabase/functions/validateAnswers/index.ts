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
      case 'multiple-choice': {
        // For multiple choice, do a strict comparison with the correct answer
        const normalizedUserAnswer = String(userAnswer).trim();
        const normalizedCorrectAnswer = String(correctAnswer).trim();
        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        
        // Log the comparison details
        console.log('Multiple choice comparison:', {
          normalizedUserAnswer,
          normalizedCorrectAnswer,
          isCorrect
        });

        explanation = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The correct answer is: ${correctAnswer}`;
        break;
      }

      case 'multiple-answer': {
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswers)) {
          throw new Error('Invalid answer format for multiple-answer question');
        }

        // For multiple answer, check if all selected answers match the correct ones exactly
        const normalizedUserAnswers = userAnswer.map(a => String(a).trim()).sort();
        const normalizedCorrectAnswers = correctAnswers.map(a => String(a).trim()).sort();

        // Log the arrays being compared
        console.log('Multiple answer comparison:', {
          normalizedUserAnswers,
          normalizedCorrectAnswers
        });

        isCorrect = 
          normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
          normalizedUserAnswers.every((answer, index) => answer === normalizedCorrectAnswers[index]);

        explanation = isCorrect 
          ? 'All correct answers selected!' 
          : `Incorrect. The correct answers were: ${correctAnswers.join(', ')}`;
        break;
      }

      case 'text': {
        // For text answers, do a case-insensitive comparison after trimming
        const normalizedUserAnswer = String(userAnswer).toLowerCase().trim();
        const normalizedCorrectAnswer = String(correctAnswer).toLowerCase().trim();
        
        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

        // Log the text comparison
        console.log('Text answer comparison:', {
          normalizedUserAnswer,
          normalizedCorrectAnswer,
          isCorrect
        });

        explanation = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The expected answer was: ${correctAnswer}`;
        break;
      }

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