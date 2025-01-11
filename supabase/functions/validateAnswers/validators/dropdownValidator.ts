import { ValidationResult } from '../types.ts';
import { normalizeText } from '../utils.ts';

export const validateDropdown = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): ValidationResult => {
  if (!userAnswer || !correctAnswer) {
    return {
      isCorrect: false,
      explanation: 'Missing answer or correct answer'
    };
  }

  // Normalize answers by trimming whitespace
  const normalizedUserAnswer = userAnswer.trim();
  const normalizedCorrectAnswer = correctAnswer.trim();

  // Special handling for mathematical symbols and operators
  if (question.toLowerCase().includes('sign') || 
      question.toLowerCase().includes('symbol') ||
      question.toLowerCase().includes('operator')) {
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    return {
      isCorrect,
      explanation: isCorrect 
        ? 'Correct!' 
        : `Incorrect. The correct answer is: ${correctAnswer}`
    };
  }

  // Regular dropdown validation
  const isCorrect = normalizeText(userAnswer) === normalizeText(correctAnswer);
  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The correct answer is: ${correctAnswer}`
  };
};