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

  // Special handling for questions about countable items
  if (question?.toLowerCase().includes('can count') || 
      question?.toLowerCase().includes('are countable') ||
      question?.toLowerCase().includes('things we can count')) {
    const normalizedUserAnswers = userAnswers.map(normalizeText);
    const isCorrect = normalizedUserAnswers.length === userAnswers.length;
    
    return {
      isCorrect,
      explanation: isCorrect 
        ? 'Correct! All of these items can be counted.'
        : `You missed some countable items. All of these options can be counted because they represent discrete, individual units that can be numbered.`
    };
  }

  // Handle number comparison questions
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
          : `You ${userNumbers.length > allPossibleAnswers.length ? 'selected too many options' : 'missed some options'}. The correct answers are: ${allPossibleAnswers.join(', ')}. These numbers are ${comparisonText.includes('less than') ? 'less than' : 'greater than'} ${comparisonNumber}.`
      };
    }
  }
  
  const normalizedUserAnswers = userAnswers.map(normalizeText);
  const normalizedCorrectAnswers = correctAnswers.map(normalizeText);
  
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
    isCorrect = normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
                normalizedUserAnswers.every(answer => 
                  answer && normalizedCorrectAnswers.includes(answer)
                );
    
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