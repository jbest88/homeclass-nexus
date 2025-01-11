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
      if (!isCorrect) {
        explanation = `Your answer "${userAnswer}" is incorrect. The question asked about ${question.toLowerCase()}. The correct answer is "${correctAnswer}" because ${correctNum} is the value that satisfies the comparison.`;
      }
    } else {
      const userValue = evaluateExponentExpression(normalizedUserAnswer);
      const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
      isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
                  Math.abs(userValue - correctValue) < 0.0001;
      if (!isCorrect) {
        explanation = `Your calculation "${userAnswer}" resulted in ${userValue}, but the correct answer "${correctAnswer}" equals ${correctValue}. Make sure to follow the order of operations.`;
      }
    }
  } else {
    const userNum = parseInt(normalizedUserAnswer);
    const correctNum = parseInt(normalizedCorrectAnswer);
    
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      isCorrect = userNum === correctNum;
      if (!isCorrect) {
        explanation = `You selected "${userAnswer}" which is not correct. The answer "${correctAnswer}" is correct because ${normalizedCorrectAnswer.includes('explanation:') ? 
          normalizedCorrectAnswer.split('explanation:')[1].trim() : 'it matches the concept discussed in the lesson'}.`;
      }
    } else {
      isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      if (!isCorrect) {
        explanation = `You selected "${userAnswer}" which is incorrect. The correct answer is "${correctAnswer}". This is because ${
          question.toLowerCase().includes('what') ? 'it directly answers what was asked in the question' :
          question.toLowerCase().includes('why') ? 'it provides the correct reasoning based on the lesson content' :
          question.toLowerCase().includes('how') ? 'it describes the correct process or method' :
          'it aligns with the information provided in the lesson'
        }.`;
      }
    }
  }

  return {
    isCorrect,
    explanation: isCorrect ? 'Correct!' : explanation
  };
};