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
    
    console.log('Validating answer for question:', {
      question,
      userAnswer,
      correctAnswer,
      correctAnswers,
      type
    });

    let isCorrect = false;
    let explanation = '';

    const evaluateMathExpression = (expr: string): number => {
      // Basic math expression evaluator
      try {
        // Remove spaces and evaluate basic operations
        const sanitizedExpr = expr.replace(/\s+/g, '')
          .replace(/(\d+)²/g, '($1 * $1)')  // Handle square
          .replace(/(\d+)¹/g, '$1');        // Handle first power
        
        // Use Function constructor to safely evaluate the expression
        return new Function(`return ${sanitizedExpr}`)();
      } catch (error) {
        console.error('Error evaluating math expression:', error);
        return NaN;
      }
    };

    switch (type) {
      case 'multiple-choice': {
        const normalizedUserAnswer = String(userAnswer).trim();
        const normalizedCorrectAnswer = String(correctAnswer).trim();

        // Check if this is a math question by looking for mathematical symbols
        const isMathQuestion = /[²¹\+\-\*\/\^]/.test(question);
        
        if (isMathQuestion) {
          console.log('Detected math question:', question);
          
          // For math questions, evaluate both answers numerically
          const userValue = evaluateMathExpression(normalizedUserAnswer);
          const correctValue = evaluateMathExpression(normalizedCorrectAnswer);
          
          console.log('Math evaluation:', {
            userValue,
            correctValue,
            userAnswer: normalizedUserAnswer,
            correctAnswer: normalizedCorrectAnswer
          });
          
          isCorrect = !isNaN(userValue) && !isNaN(correctValue) && userValue === correctValue;
        } else {
          // For non-math questions, do a direct string comparison
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }

        console.log('Multiple choice comparison result:', {
          isCorrect,
          isMathQuestion
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

        const normalizedUserAnswers = userAnswer.map(a => String(a).trim()).sort();
        const normalizedCorrectAnswers = correctAnswers.map(a => String(a).trim()).sort();

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
        const normalizedUserAnswer = String(userAnswer).toLowerCase().trim();
        const normalizedCorrectAnswer = String(correctAnswer).toLowerCase().trim();
        
        // Check if this is a math question
        const isMathQuestion = /[²¹\+\-\*\/\^]/.test(question);
        
        if (isMathQuestion) {
          const userValue = evaluateMathExpression(normalizedUserAnswer);
          const correctValue = evaluateMathExpression(normalizedCorrectAnswer);
          isCorrect = !isNaN(userValue) && !isNaN(correctValue) && userValue === correctValue;
        } else {
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }

        console.log('Text answer comparison:', {
          normalizedUserAnswer,
          normalizedCorrectAnswer,
          isCorrect,
          isMathQuestion
        });

        explanation = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The expected answer was: ${correctAnswer}`;
        break;
      }

      default:
        throw new Error(`Unsupported question type: ${type}`);
    }

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