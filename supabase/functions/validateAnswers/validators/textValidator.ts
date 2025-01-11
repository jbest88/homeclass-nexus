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
        : `Your answer "${userAnswer}" is incorrect. The symbol "${correctAnswer}" is the correct mathematical notation for this operation.`
    };
  }

  // Regular text validation with specific feedback
  const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  
  let explanation = '';
  if (!isCorrect) {
    if (question.toLowerCase().includes('define') || question.toLowerCase().includes('what is')) {
      explanation = `Your definition "${userAnswer}" is not accurate. The correct definition is "${correctAnswer}". Pay attention to the key terms and their precise meanings.`;
    } else if (question.toLowerCase().includes('example')) {
      explanation = `Your example "${userAnswer}" is not appropriate. "${correctAnswer}" is a better example because it clearly demonstrates the concept being tested.`;
    } else if (question.toLowerCase().includes('explain') || question.toLowerCase().includes('why')) {
      explanation = `Your explanation "${userAnswer}" is incomplete or incorrect. The correct explanation is "${correctAnswer}". Focus on the cause-and-effect relationship discussed in the lesson.`;
    } else if (question.toLowerCase().includes('how')) {
      explanation = `Your process "${userAnswer}" is not correct. The proper method is "${correctAnswer}". Make sure to include all the necessary steps in the right order.`;
    } else {
      explanation = `Your answer "${userAnswer}" is incorrect. The correct answer is "${correctAnswer}". Review the relevant section in the lesson material.`;
    }
  }

  return {
    isCorrect,
    explanation: isCorrect ? 'Correct!' : explanation
  };
};