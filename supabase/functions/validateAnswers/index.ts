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

interface ValidationResult {
  isCorrect: boolean;
  explanation: string;
}

// Utility function to evaluate mathematical expressions with exponents
const evaluateExponentExpression = (expr: string): number => {
  try {
    const normalized = expr.replace(/\s+/g, '')
      .replace(/([0-9])²/g, '$1^2')
      .replace(/([0-9])³/g, '$1^3')
      .replace(/([0-9])⁴/g, '$1^4')
      .replace(/([0-9])⁵/g, '$1^5')
      .replace(/([0-9])⁶/g, '$1^6')
      .replace(/([0-9])⁷/g, '$1^7')
      .replace(/([0-9])⁸/g, '$1^8')
      .replace(/([0-9])⁹/g, '$1^9')
      .replace(/([0-9])¹/g, '$1^1');

    const parts = normalized.split(/([×\+\-\/])/);
    const evaluated = parts.map(part => {
      if (part.includes('^')) {
        const [base, exponent] = part.split('^').map(Number);
        return Math.pow(base, exponent);
      }
      return part;
    }).join('');

    return new Function(`return ${evaluated}`)();
  } catch (error) {
    console.error('Error evaluating exponent expression:', error);
    return NaN;
  }
};

// Utility function to check if a question is a math question
const isMathQuestion = (question: string): boolean => {
  return /[²³⁴⁵⁶⁷⁸⁹¹×\+\-\/\^]/.test(question);
};

// Validate multiple choice questions
const validateMultipleChoice = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): ValidationResult => {
  const normalizedUserAnswer = String(userAnswer).trim();
  const normalizedCorrectAnswer = String(correctAnswer).trim();
  let isCorrect = false;

  if (isMathQuestion(question)) {
    console.log('Detected math question:', question);
    const userValue = evaluateExponentExpression(normalizedUserAnswer);
    const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
    
    console.log('Math evaluation:', {
      userValue,
      correctValue,
      userAnswer: normalizedUserAnswer,
      correctAnswer: normalizedCorrectAnswer
    });
    
    isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
                Math.abs(userValue - correctValue) < 0.0001;
  } else {
    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The correct answer is: ${correctAnswer}`
  };
};

// Validate multiple answer questions
const validateMultipleAnswer = (
  userAnswer: string[],
  correctAnswers: string[]
): ValidationResult => {
  const normalizedUserAnswers = userAnswer.map(a => String(a).trim()).sort();
  const normalizedCorrectAnswers = correctAnswers.map(a => String(a).trim()).sort();

  console.log('Multiple answer validation:', {
    normalizedUserAnswers,
    normalizedCorrectAnswers,
    userAnswerLength: normalizedUserAnswers.length,
    correctAnswersLength: normalizedCorrectAnswers.length
  });

  const allOfTheAboveOption = correctAnswers.find(answer => 
    answer.toLowerCase().includes('all of the above'));

  let isCorrect = false;

  if (allOfTheAboveOption) {
    const availableOptions = correctAnswers.filter(answer => 
      !answer.toLowerCase().includes('all of the above'));
    
    isCorrect = (
      (normalizedUserAnswers.length === 1 && 
       normalizedUserAnswers[0].toLowerCase().includes('all of the above')) ||
      (normalizedUserAnswers.length === availableOptions.length &&
       availableOptions.every(option => normalizedUserAnswers.includes(option)))
    );
  } else {
    isCorrect = 
      normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
      normalizedUserAnswers.every(answer => normalizedCorrectAnswers.includes(answer));
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'All correct answers selected!' 
      : `Incorrect. The correct answers were: ${correctAnswers.join(', ')}`
  };
};

// Validate text questions
const validateText = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): ValidationResult => {
  const normalizedUserAnswer = String(userAnswer).toLowerCase().trim();
  const normalizedCorrectAnswer = String(correctAnswer).toLowerCase().trim();
  let isCorrect = false;
  
  if (isMathQuestion(question)) {
    const userValue = evaluateExponentExpression(normalizedUserAnswer);
    const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
    isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
               Math.abs(userValue - correctValue) < 0.0001;
  } else {
    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The expected answer was: ${correctAnswer}`
  };
};

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

    let result: ValidationResult;

    switch (type) {
      case 'multiple-choice':
        if (!correctAnswer) throw new Error('Correct answer is required for multiple choice questions');
        result = validateMultipleChoice(userAnswer as string, correctAnswer, question);
        break;

      case 'multiple-answer':
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswers)) {
          throw new Error('Invalid answer format for multiple-answer question');
        }
        result = validateMultipleAnswer(userAnswer, correctAnswers);
        break;

      case 'text':
        if (!correctAnswer) throw new Error('Correct answer is required for text questions');
        result = validateText(userAnswer as string, correctAnswer, question);
        break;

      default:
        throw new Error(`Unsupported question type: ${type}`);
    }

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