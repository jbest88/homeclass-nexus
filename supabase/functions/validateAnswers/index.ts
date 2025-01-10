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

// Utility function to normalize text for comparison
const normalizeText = (text: string): string => {
  return String(text).toLowerCase().trim();
};

// Utility function to check if a string indicates "all of the above"
const isAllOfTheAbove = (text: string): boolean => {
  return normalizeText(text).includes('all of the above');
};

// Utility function to evaluate mathematical expressions
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
    console.error('Error evaluating expression:', error);
    return NaN;
  }
};

// Utility function to check if a question involves math
const isMathQuestion = (question: string): boolean => {
  return /[²³⁴⁵⁶⁷⁸⁹¹×\+\-\/\^]/.test(question);
};

// Validate multiple choice questions
const validateMultipleChoice = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): ValidationResult => {
  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);

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
      : `Incorrect. The correct answer is: ${correctAnswer}`
  };
};

// Validate multiple answer questions
const validateMultipleAnswer = (
  userAnswers: string[],
  correctAnswers: string[]
): ValidationResult => {
  console.log('Validating multiple answer:', { userAnswers, correctAnswers });
  
  const normalizedUserAnswers = userAnswers.map(normalizeText).sort();
  const normalizedCorrectAnswers = correctAnswers.map(normalizeText).sort();
  
  // Check if "All of the above" is among the correct answers
  const hasAllOfTheAbove = correctAnswers.some(isAllOfTheAbove);
  
  let isCorrect = false;
  
  if (hasAllOfTheAbove) {
    // Case 1: User selected "All of the above"
    if (userAnswers.length === 1 && isAllOfTheAbove(userAnswers[0])) {
      isCorrect = true;
    }
    // Case 2: User selected all individual options (excluding "All of the above")
    else {
      const individualOptions = correctAnswers.filter(answer => !isAllOfTheAbove(answer));
      isCorrect = userAnswers.length === individualOptions.length &&
                 individualOptions.every(option => 
                   userAnswers.some(userAns => normalizeText(userAns) === normalizeText(option))
                 );
    }
  } else {
    // Regular multiple answer validation
    isCorrect = normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
                normalizedUserAnswers.every(answer => 
                  normalizedCorrectAnswers.includes(answer)
                );
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
  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);
  
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
    
    console.log('Validating answer:', {
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