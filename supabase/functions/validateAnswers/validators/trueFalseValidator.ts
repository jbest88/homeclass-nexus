import { ValidationResult } from '../types.ts';
import { normalizeText, isNumberComparisonQuestion } from '../utils.ts';

export const validateTrueFalse = (
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
  
  if (isNumberComparisonQuestion(question)) {
    const numbers = question.match(/[\d,]+/g)?.map(num => Number(num.replace(/,/g, '')));
    
    if (numbers && numbers.length >= 2) {
      const [firstNumber, secondNumber] = numbers;
      
      let calculatedAnswer;
      if (question.includes('greater than')) {
        calculatedAnswer = (firstNumber > secondNumber).toString();
      } else if (question.includes('less than')) {
        calculatedAnswer = (firstNumber < secondNumber).toString();
      } else {
        calculatedAnswer = (firstNumber === secondNumber).toString();
      }
      
      const isCorrect = normalizedUserAnswer === calculatedAnswer;
      return {
        isCorrect,
        explanation: isCorrect 
          ? 'Correct!' 
          : `Incorrect. The correct answer is: ${calculatedAnswer}`
      };
    }
  }
  
  const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The correct answer is: ${correctAnswer}`
  };
};