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
      let explanation;
      if (question.includes('greater than')) {
        calculatedAnswer = (firstNumber > secondNumber).toString();
        explanation = `${firstNumber} is ${firstNumber > secondNumber ? '' : 'not'} greater than ${secondNumber}`;
      } else if (question.includes('less than')) {
        calculatedAnswer = (firstNumber < secondNumber).toString();
        explanation = `${firstNumber} is ${firstNumber < secondNumber ? '' : 'not'} less than ${secondNumber}`;
      } else {
        calculatedAnswer = (firstNumber === secondNumber).toString();
        explanation = `${firstNumber} is ${firstNumber === secondNumber ? '' : 'not'} equal to ${secondNumber}`;
      }
      
      const isCorrect = normalizedUserAnswer === calculatedAnswer;
      return {
        isCorrect,
        explanation: isCorrect 
          ? 'Correct!' 
          : `Your answer "${userAnswer}" is incorrect. ${explanation}.`
      };
    }
  }
  
  const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Your answer "${userAnswer}" is incorrect. The statement is ${correctAnswer} because ${
        question.toLowerCase().includes('not') ? 
          `it explicitly ${correctAnswer === 'true' ? 'does' : 'does not'} negate the concept discussed` :
        question.toLowerCase().includes('always') ?
          `it ${correctAnswer === 'true' ? 'consistently applies' : 'has exceptions'} to the concept` :
        question.toLowerCase().includes('never') ?
          `it ${correctAnswer === 'true' ? 'absolutely prevents' : 'sometimes allows'} this situation` :
        `it ${correctAnswer === 'true' ? 'accurately reflects' : 'contradicts'} what was taught in the lesson`
      }.`
  };
};