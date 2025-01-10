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

    const evaluateExponentExpression = (expr: string): number => {
      try {
        // Remove spaces and normalize the expression
        const normalized = expr.replace(/\s+/g, '')
          // Convert superscript numbers to regular exponent notation
          .replace(/([0-9])²/g, '$1^2')
          .replace(/([0-9])³/g, '$1^3')
          .replace(/([0-9])⁴/g, '$1^4')
          .replace(/([0-9])⁵/g, '$1^5')
          .replace(/([0-9])⁶/g, '$1^6')
          .replace(/([0-9])⁷/g, '$1^7')
          .replace(/([0-9])⁸/g, '$1^8')
          .replace(/([0-9])⁹/g, '$1^9')
          .replace(/([0-9])¹/g, '$1^1');

        // Split the expression into parts
        const parts = normalized.split(/([×\+\-\/])/);
        
        // Process each part and evaluate exponents
        const evaluated = parts.map(part => {
          if (part.includes('^')) {
            const [base, exponent] = part.split('^').map(Number);
            return Math.pow(base, exponent);
          }
          return part;
        }).join('');

        // Use Function constructor to safely evaluate the final expression
        return new Function(`return ${evaluated}`)();
      } catch (error) {
        console.error('Error evaluating exponent expression:', error);
        return NaN;
      }
    };

    switch (type) {
      case 'multiple-choice': {
        const normalizedUserAnswer = String(userAnswer).trim();
        const normalizedCorrectAnswer = String(correctAnswer).trim();

        // Check if this is a math question by looking for mathematical symbols
        const isMathQuestion = /[²³⁴⁵⁶⁷⁸⁹¹×\+\-\/\^]/.test(question);
        
        if (isMathQuestion) {
          console.log('Detected math question:', question);
          
          // For math questions, evaluate both answers numerically
          const userValue = evaluateExponentExpression(normalizedUserAnswer);
          const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
          
          console.log('Math evaluation:', {
            userValue,
            correctValue,
            userAnswer: normalizedUserAnswer,
            correctAnswer: normalizedCorrectAnswer
          });
          
          isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
                     Math.abs(userValue - correctValue) < 0.0001; // Using small epsilon for floating point comparison
        } else {
          // For non-math questions, do a direct string comparison
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }

        explanation = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The correct answer is: ${correctAnswer}`;
        break;
      }

      case 'multiple-answer': {
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswers)) {
          throw new Error('Invalid answer format for multiple-answer question');
        }

        // Sort and normalize both arrays for comparison
        const normalizedUserAnswers = userAnswer.map(a => String(a).trim()).sort();
        const normalizedCorrectAnswers = correctAnswers.map(a => String(a).trim()).sort();

        console.log('Multiple answer validation:', {
          normalizedUserAnswers,
          normalizedCorrectAnswers,
          userAnswerLength: normalizedUserAnswers.length,
          correctAnswersLength: normalizedCorrectAnswers.length
        });

        // Check if "All of the above" is present in the correct answers
        const allOfTheAboveOption = correctAnswers.find(answer => 
          answer.toLowerCase().includes('all of the above'));

        if (allOfTheAboveOption) {
          // For "All of the above" questions, user must select all options
          const availableOptions = correctAnswers.filter(answer => 
            !answer.toLowerCase().includes('all of the above'));
          
          // Check if user selected all available options or just the "All of the above" option
          isCorrect = (
            // Case 1: User selected "All of the above" option
            (normalizedUserAnswers.length === 1 && 
             normalizedUserAnswers[0].toLowerCase().includes('all of the above')) ||
            // Case 2: User selected all individual options
            (normalizedUserAnswers.length === availableOptions.length &&
             availableOptions.every(option => 
               normalizedUserAnswers.includes(option)))
          );
        } else {
          // Regular comparison for other cases
          isCorrect = 
            normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
            normalizedUserAnswers.every(answer => normalizedCorrectAnswers.includes(answer));
        }

        explanation = isCorrect 
          ? 'All correct answers selected!' 
          : `Incorrect. The correct answers were: ${correctAnswers.join(', ')}`;
        break;
      }

      case 'text': {
        const normalizedUserAnswer = String(userAnswer).toLowerCase().trim();
        const normalizedCorrectAnswer = String(correctAnswer).toLowerCase().trim();
        
        const isMathQuestion = /[²³⁴⁵⁶⁷⁸⁹¹×\+\-\/\^]/.test(question);
        
        if (isMathQuestion) {
          const userValue = evaluateExponentExpression(normalizedUserAnswer);
          const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
          isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
                     Math.abs(userValue - correctValue) < 0.0001;
        } else {
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }

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