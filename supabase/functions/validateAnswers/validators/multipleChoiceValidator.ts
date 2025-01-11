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

  let isCorrect = false;
  let explanation = '';

  if (isMathQuestion(question)) {
    if (isNumberComparisonQuestion(question)) {
      const userNum = wordToNumber(normalizedUserAnswer);
      const correctNum = wordToNumber(normalizedCorrectAnswer);
      isCorrect = userNum !== null && correctNum !== null && userNum === correctNum;
    } else {
      const userValue = evaluateExponentExpression(normalizedUserAnswer);
      const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
      isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
                  Math.abs(userValue - correctValue) < 0.0001;
    }
  } else {
    const userNum = parseInt(normalizedUserAnswer);
    const correctNum = parseInt(normalizedCorrectAnswer);
    
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      isCorrect = userNum === correctNum;
      if (!isCorrect) {
        explanation = `The correct answer is: ${correctNum}. ${normalizedCorrectAnswer.includes('explanation:') ? 
          normalizedCorrectAnswer.split('explanation:')[1].trim() : ''}`;
      }
    } else {
      isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    }
  }

  return {
    isCorrect,
    explanation: isCorrect ? 'Correct!' : (explanation || `Incorrect. The correct answer is: ${correctAnswer}`)
  };
};