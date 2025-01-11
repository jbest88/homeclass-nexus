import { ValidationResult } from '../types.ts';
import { normalizeText, isMathQuestion, isNumberComparisonQuestion } from '../utils.ts';
import { wordToNumber, evaluateExponentExpression } from './numberUtils.ts';

export const validateMultipleChoice = (
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

  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);

  // Direct string comparison for exact matches
  if (normalizedUserAnswer === normalizedCorrectAnswer) {
    return {
      isCorrect: true,
      explanation: `Correct! "${userAnswer}" is the right answer.`
    };
  }

  // Handle math-specific questions
  if (isMathQuestion(question)) {
    if (isNumberComparisonQuestion(question)) {
      const userNum = wordToNumber(normalizedUserAnswer);
      const correctNum = wordToNumber(normalizedCorrectAnswer);
      const isCorrect = userNum !== null && correctNum !== null && userNum === correctNum;
      
      return {
        isCorrect,
        explanation: isCorrect 
          ? `Correct! "${userAnswer}" is the right answer.`
          : `Your answer "${userAnswer}" is incorrect. The correct answer is "${correctAnswer}".`
      };
    } else {
      const userValue = evaluateExponentExpression(normalizedUserAnswer);
      const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
      const isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
                Math.abs(userValue - correctValue) < 0.0001;
      
      return {
        isCorrect,
        explanation: isCorrect
          ? `Correct! "${userAnswer}" is the right answer.`
          : `Your calculation "${userAnswer}" is incorrect. The correct answer is "${correctAnswer}".`
      };
    }
  }

  // For questions about uses or purposes
  if (question.toLowerCase().includes('use') || question.toLowerCase().includes('purpose')) {
    const explanations: Record<string, string> = {
      'numbers': 'Numbers are essential for counting, measuring, and performing calculations.',
      'shapes': 'Shapes help us understand and describe geometric forms and patterns.',
      'patterns': 'Patterns help us recognize and predict sequences and relationships.',
      'letters': 'Letters are used for writing and representing sounds in language.'
    };

    return {
      isCorrect: false,
      explanation: `Your answer "${userAnswer}" is incorrect. The correct answer is "${correctAnswer}". ${explanations[normalizedCorrectAnswer.toLowerCase()] || ''}`
    };
  }

  // Default case for other types of questions
  return {
    isCorrect: false,
    explanation: `Your answer "${userAnswer}" is incorrect. The correct answer is "${correctAnswer}".`
  };
};