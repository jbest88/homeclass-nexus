import { ValidationResult } from '../types.ts';
import { normalizeText } from '../utils.ts';

export const validateText = (
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

  // Normalize answers by trimming whitespace and converting to lowercase
  const normalizedUserAnswer = normalizeText(userAnswer).trim();
  const normalizedCorrectAnswer = normalizeText(correctAnswer).trim();

  // Special handling for mathematical symbols
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

  // Regular text validation
  const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The expected answer was: ${correctAnswer}`
  };
};