import { ValidationResult } from './types.ts';
import { normalizeText, isAllOfTheAbove, evaluateExponentExpression, isMathQuestion } from './utils.ts';

// Validate true-false questions
export const validateTrueFalse = (
  userAnswer: string,
  correctAnswer: string
): ValidationResult => {
  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);
  
  const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  
  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The correct answer is: ${correctAnswer}`
  };
};

// Validate multiple choice questions
export const validateMultipleChoice = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): ValidationResult => {
  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);

  let isCorrect = false;
  if (isMathQuestion(question)) {
    const userValue = evaluateExponentExpression(normalizedUserAnswer);
    const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
    isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
                Math.abs(userValue - correctValue) < 0.0001;
  } else {
    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The correct answer is: ${correctAnswer}`
  };
};

// Validate multiple answer questions
export const validateMultipleAnswer = (
  userAnswers: string[],
  correctAnswers: string[]
): ValidationResult => {
  console.log('Validating multiple answer:', { userAnswers, correctAnswers });
  
  // Normalize all answers for comparison
  const normalizedUserAnswers = userAnswers.map(normalizeText);
  const normalizedCorrectAnswers = correctAnswers.map(normalizeText);
  
  // Check if "All of the above" is among the correct answers
  const hasAllOfTheAbove = correctAnswers.some(isAllOfTheAbove);
  
  let isCorrect = false;
  
  if (hasAllOfTheAbove) {
    // Case 1: User selected "All of the above"
    const userSelectedAllOfTheAbove = normalizedUserAnswers.some(isAllOfTheAbove);
    
    // Case 2: User selected all individual options (excluding "All of the above")
    const individualOptions = correctAnswers.filter(answer => !isAllOfTheAbove(answer));
    const selectedAllIndividualOptions = 
      normalizedUserAnswers.length === individualOptions.length &&
      individualOptions.every(option => 
        normalizedUserAnswers.includes(normalizeText(option))
      );
    
    isCorrect = userSelectedAllOfTheAbove || selectedAllIndividualOptions;
  } else {
    // Regular multiple answer validation
    isCorrect = normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
                normalizedUserAnswers.every(answer => 
                  normalizedCorrectAnswers.includes(answer)
                );
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'All correct answers selected!' 
      : `Incorrect. The correct answers were: ${correctAnswers.join(', ')}`
  };
};

// Validate text questions
export const validateText = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): ValidationResult => {
  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);
  
  let isCorrect = false;
  if (isMathQuestion(question)) {
    const userValue = evaluateExponentExpression(normalizedUserAnswer);
    const correctValue = evaluateExponentExpression(normalizedCorrectAnswer);
    isCorrect = !isNaN(userValue) && !isNaN(correctValue) && 
               Math.abs(userValue - correctValue) < 0.0001;
  } else {
    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The expected answer was: ${correctAnswer}`
  };
};