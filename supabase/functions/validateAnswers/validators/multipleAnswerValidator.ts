import { ValidationResult } from '../types.ts';
import { normalizeText, isAllOfTheAbove, isNumberComparisonQuestion } from '../utils.ts';
import { wordToNumber } from './numberUtils.ts';
import type { MultipleAnswerValidationOptions } from './types.ts';

export const validateMultipleAnswer = ({
  userAnswers,
  correctAnswers,
  question
}: MultipleAnswerValidationOptions): ValidationResult => {
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

  // Handle number comparison questions
  if (question && isNumberComparisonQuestion(question)) {
    const comparisonText = question.toLowerCase();
    let targetNumber: number | null = null;
    let comparisonOperator: 'less' | 'greater' | null = null;

    // Extract comparison details
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
      // Convert user answers to numbers
      const userNumbers = userAnswers.map(ans => {
        const num = parseInt(ans);
        return isNaN(num) ? null : num;
      }).filter((n): n is number => n !== null);

      // Validate each number against the comparison
      const areAllAnswersValid = userNumbers.every(num => 
        comparisonOperator === 'less' ? num < targetNumber! : num > targetNumber!
      );

      // Get all valid options from the question
      const allOptions = question.split('\n')
        .map(line => line.trim())
        .filter(line => /^\d+$/.test(line))
        .map(Number);

      // Find all correct answers based on the comparison
      const validAnswers = allOptions.filter(num =>
        comparisonOperator === 'less' ? num < targetNumber! : num > targetNumber!
      );

      // Check if user selected all and only the valid answers
      const hasAllValidAnswers = validAnswers.every(valid => 
        userNumbers.includes(valid)
      );
      const hasOnlyValidAnswers = userNumbers.every(userNum => 
        validAnswers.includes(userNum)
      );

      const isCorrect = areAllAnswersValid && hasAllValidAnswers && hasOnlyValidAnswers;

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
  
  let isCorrect = false;
  let explanation = '';
  
  if (hasAllOfTheAbove) {
    const userSelectedAllOfTheAbove = normalizedUserAnswers.some(answer => answer && isAllOfTheAbove(answer));
    const individualOptions = correctAnswers.filter(answer => answer && !isAllOfTheAbove(answer));
    const selectedAllIndividualOptions = 
      normalizedUserAnswers.length === individualOptions.length &&
      individualOptions.every(option => 
        option && normalizedUserAnswers.includes(normalizeText(option))
      );
    
    isCorrect = userSelectedAllOfTheAbove || selectedAllIndividualOptions;
    if (!isCorrect) {
      explanation = userSelectedAllOfTheAbove && normalizedUserAnswers.length > 1
        ? "When selecting 'All of the above', you shouldn't select other options."
        : `You need to either select 'All of the above' or select each correct option individually: ${individualOptions.join(', ')}.`;
    }
  } else {
    // Sort both arrays to ensure order doesn't matter
    const sortedUserAnswers = [...normalizedUserAnswers].sort();
    const sortedCorrectAnswers = [...normalizedCorrectAnswers].sort();
    
    // Compare the sorted arrays
    isCorrect = sortedUserAnswers.length === sortedCorrectAnswers.length &&
                sortedUserAnswers.every((answer, index) => answer === sortedCorrectAnswers[index]);
    
    if (!isCorrect) {
      const missing = correctAnswers.filter(answer => 
        !normalizedUserAnswers.includes(normalizeText(answer))
      );
      const extra = userAnswers.filter(answer => 
        !normalizedCorrectAnswers.includes(normalizeText(answer))
      );
      
      explanation = `You ${missing.length ? `missed these correct options: ${missing.join(', ')}` : ''}${
        missing.length && extra.length ? ' and ' : ''
      }${extra.length ? `incorrectly selected these options: ${extra.join(', ')}` : ''}.`;
    }
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'All correct answers selected!' 
      : explanation || `The correct answers were: ${correctAnswers.join(', ')}`
  };
};