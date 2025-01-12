import { ValidationResult } from '../types.ts';
import { normalizeText, isAllOfTheAbove, isNumberComparisonQuestion } from '../utils.ts';
import { wordToNumber } from './numberUtils.ts';
import type { MultipleAnswerValidationOptions } from './types.ts';

export const validateMultipleAnswer = async ({
  userAnswers,
  correctAnswers,
  question
}: MultipleAnswerValidationOptions): Promise<ValidationResult> => {
  if (!Array.isArray(userAnswers) || !Array.isArray(correctAnswers)) {
    return {
      isCorrect: false,
      explanation: 'Invalid answer format'
    };
  }

  if (!userAnswers.length || !correctAnswers.length) {
    return {
      isCorrect: false,
      explanation: 'No answers provided'
    };
  }

  try {
    // Use AI validation for all multiple answer questions
    const response = await fetch('http://localhost:54321/functions/v1/validateAnswerWithAI', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        userAnswers,
        correctAnswers,
        type: 'multiple-answer'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate with AI');
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    // If AI validation fails, fall back to traditional validation
    if (!result.aiResponse) {
      console.log('Falling back to traditional validation');
      return validateTraditional();
    }

    return {
      isCorrect: result.isCorrect,
      explanation: result.isCorrect 
        ? 'Correct! All answers are valid.' 
        : `The correct answers are: ${correctAnswers.join(', ')}`
    };
  } catch (error) {
    console.error('AI validation failed, falling back to traditional validation:', error);
    return validateTraditional();
  }

  function validateTraditional(): ValidationResult {
    // Handle number comparison questions
    if (question && isNumberComparisonQuestion(question)) {
      const comparisonText = question.toLowerCase();
      let targetNumber: number | null = null;
      let comparisonOperator: 'less' | 'greater' | null = null;

      if (comparisonText.includes('less than')) {
        const match = comparisonText.match(/less than (\d+)/i);
        if (match) {
          targetNumber = parseInt(match[1]);
          comparisonOperator = 'less';
        }
      } else if (comparisonText.includes('greater than')) {
        const match = comparisonText.match(/greater than (\d+)/i);
        if (match) {
          targetNumber = parseInt(match[1]);
          comparisonOperator = 'greater';
        }
      }

      if (targetNumber !== null && comparisonOperator) {
        const userNumbers = userAnswers.map(ans => {
          const num = parseInt(ans);
          return isNaN(num) ? null : num;
        }).filter((n): n is number => n !== null);

        const allOptions = question.split('\n')
          .map(line => line.trim())
          .filter(line => /^\d+$/.test(line))
          .map(Number);

        const validAnswers = allOptions.filter(num =>
          comparisonOperator === 'less' ? num < targetNumber! : num > targetNumber!
        );

        const hasAllValidAnswers = validAnswers.every(valid => 
          userNumbers.includes(valid)
        );
        const hasOnlyValidAnswers = userNumbers.every(userNum => 
          validAnswers.includes(userNum)
        );

        const isCorrect = hasAllValidAnswers && hasOnlyValidAnswers;

        return {
          isCorrect,
          explanation: isCorrect 
            ? 'Correct! You selected all the valid numbers.' 
            : `The correct answers are: ${validAnswers.join(', ')}. These are all the numbers that are ${
                comparisonOperator === 'less' ? 'less than' : 'greater than'
              } ${targetNumber}.`
        };
      }
    }
    
    // Normalize both arrays for comparison
    const normalizedUserAnswers = userAnswers.map(answer => normalizeText(answer || ''));
    const normalizedCorrectAnswers = correctAnswers.map(answer => normalizeText(answer || ''));
    
    const hasAllOfTheAbove = correctAnswers.some(answer => answer && isAllOfTheAbove(answer));
    
    if (hasAllOfTheAbove) {
      const userSelectedAllOfTheAbove = normalizedUserAnswers.some(answer => 
        answer && isAllOfTheAbove(answer)
      );
      const individualOptions = correctAnswers.filter(answer => 
        answer && !isAllOfTheAbove(answer)
      );
      const selectedAllIndividualOptions = 
        normalizedUserAnswers.length === individualOptions.length &&
        individualOptions.every(option => 
          option && normalizedUserAnswers.includes(normalizeText(option))
        );
      
      const isCorrect = userSelectedAllOfTheAbove || selectedAllIndividualOptions;
      
      return {
        isCorrect,
        explanation: isCorrect 
          ? 'All correct answers selected!' 
          : `The correct answers are: ${correctAnswers.join(', ')}`
      };
    }

    // Sort both arrays to ensure order doesn't matter
    const sortedUserAnswers = [...normalizedUserAnswers].sort();
    const sortedCorrectAnswers = [...normalizedCorrectAnswers].sort();
    
    const isCorrect = sortedUserAnswers.length === sortedCorrectAnswers.length &&
                     sortedUserAnswers.every((answer, index) => 
                       answer === sortedCorrectAnswers[index]
                     );
    
    return {
      isCorrect,
      explanation: isCorrect 
        ? 'All correct answers selected!' 
        : `The correct answers are: ${correctAnswers.join(', ')}`
    };
  }
};