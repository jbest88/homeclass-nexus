import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ValidationRequest } from './types.ts';
import { 
  validateMultipleChoice, 
  validateMultipleAnswer, 
  validateText, 
  validateTrueFalse, 
  validateDropdown 
} from './validators/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const requestData = await req.json();
    const { question, userAnswer, correctAnswer, type } = requestData as ValidationRequest;
    
    console.log('Validating answer:', { question, type, userAnswer });

    if (!question || !type) {
      throw new Error('Missing required fields: question and type are required');
    }

    let result;

    switch (type) {
      case 'multiple-choice':
        if (!correctAnswer) {
          throw new Error('Correct answer is required for multiple choice questions');
        }
        result = validateMultipleChoice(userAnswer as string, correctAnswer, question);
        break;

      case 'multiple-answer':
        const correctAnswers = requestData.correctAnswers;
        if (!Array.isArray(correctAnswers)) {
          throw new Error('Correct answers array is required for multiple-answer questions');
        }
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
        result = validateMultipleAnswer({
          userAnswers: userAnswerArray,
          correctAnswers,
          question
        });
        break;

      case 'text':
        if (!correctAnswer) {
          throw new Error('Correct answer is required for text questions');
        }
        result = validateText(userAnswer as string, correctAnswer, question);
        break;

      case 'true-false':
        if (!correctAnswer) {
          throw new Error('Correct answer is required for true-false questions');
        }
        result = validateTrueFalse(userAnswer as string, correctAnswer, question);
        break;

      case 'dropdown':
        if (!correctAnswer) {
          throw new Error('Correct answer is required for dropdown questions');
        }
        result = validateDropdown(userAnswer as string, correctAnswer, question);
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
        explanation: `Error validating answer: ${error.message}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});