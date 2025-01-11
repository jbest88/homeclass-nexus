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

  if (question && isNumberComparisonQuestion(question)) {
    const comparisonText = question.toLowerCase();
    const comparisonNumber = comparisonText.includes('less than') ? 
      wordToNumber(comparisonText.split('less than')[1].trim()) :
      comparisonText.includes('greater than') ? 
        wordToNumber(comparisonText.split('greater than')[1].trim()) : 
        null;
    
    if (comparisonNumber !== null) {
      const userNumbers = userAnswers.map(ans => wordToNumber(ans)).filter((n): n is number => n !== null);
      
      const allPossibleAnswers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
        .map(word => ({ word, number: wordToNumber(word) }))
        .filter(({ number }) => number !== null && (
          comparisonText.includes('less than') ? number < comparisonNumber :
          comparisonText.includes('greater than') ? number > comparisonNumber :
          false
        ))
        .map(({ word }) => word);
      
      const isCorrect = userNumbers.length === allPossibleAnswers.length &&
                       userNumbers.every(num => 
                         comparisonText.includes('less than') ? 
                           num < comparisonNumber : num > comparisonNumber
                       );

      return {
        isCorrect,
        explanation: isCorrect 
          ? 'All correct answers selected!' 
          : `Incorrect. The correct answers were: ${allPossibleAnswers.join(', ')}`
      };
    }
  }
  
  const normalizedUserAnswers = userAnswers.map(normalizeText);
  const normalizedCorrectAnswers = correctAnswers.map(normalizeText);
  
  const hasAllOfTheAbove = correctAnswers.some(answer => answer && isAllOfTheAbove(answer));
  
  let isCorrect = false;
  
  if (hasAllOfTheAbove) {
    const userSelectedAllOfTheAbove = normalizedUserAnswers.some(answer => answer && isAllOfTheAbove(answer));
    const individualOptions = correctAnswers.filter(answer => answer && !isAllOfTheAbove(answer));
    const selectedAllIndividualOptions = 
      normalizedUserAnswers.length === individualOptions.length &&
      individualOptions.every(option => 
        option && normalizedUserAnswers.includes(normalizeText(option))
      );
    
    isCorrect = userSelectedAllOfTheAbove || selectedAllIndividualOptions;
  } else {
    isCorrect = normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
                normalizedUserAnswers.every(answer => 
                  answer && normalizedCorrectAnswers.includes(answer)
                );
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'All correct answers selected!' 
      : `Incorrect. The correct answers were: ${correctAnswers.join(', ')}`
  };
};