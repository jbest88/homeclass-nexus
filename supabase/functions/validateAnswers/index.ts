import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './utils.ts';
import { ValidationRequest } from './types.ts';
import { validateMultipleChoice, validateMultipleAnswer, validateText } from './validators.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userAnswer, correctAnswer, correctAnswers, type } = await req.json() as ValidationRequest;
    
    console.log('Validating answer:', {
      question,
      userAnswer,
      correctAnswer,
      correctAnswers,
      type
    });

    let result;

    switch (type) {
      case 'multiple-choice':
        if (!correctAnswer) {
          throw new Error('Correct answer is required for multiple choice questions');
        }
        result = validateMultipleChoice(userAnswer as string, correctAnswer, question);
        break;

      case 'multiple-answer':
        if (!Array.isArray(correctAnswers)) {
          throw new Error('Correct answers array is required for multiple-answer questions');
        }
        // Ensure userAnswer is always treated as an array for multiple-answer questions
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        result = validateMultipleAnswer(userAnswerArray, correctAnswers);
        break;

      case 'text':
        if (!correctAnswer) {
          throw new Error('Correct answer is required for text questions');
        }
        result = validateText(userAnswer as string, correctAnswer, question);
        break;

      default:
        throw new Error(`Unsupported question type: ${type}`);
    }

    console.log('Validation result:', result);

    return new Response(
      JSON.stringify(result),
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