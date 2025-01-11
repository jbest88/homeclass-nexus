import { ValidationResult } from './types.ts';
import { 
  normalizeText, 
  isAllOfTheAbove, 
  evaluateExponentExpression, 
  isMathQuestion,
  wordToNumber,
  isNumberComparisonQuestion
} from './utils.ts';

// Validate true-false questions
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

// Validate multiple choice and dropdown questions
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

  // Normalize both answers by trimming whitespace and converting to lowercase
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
    // For non-math questions, do a direct string comparison after normalization
    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The correct answer is: ${correctAnswer}`
  };
};

export const validateMultipleAnswer = (
  userAnswers: string[],
  correctAnswers: string[],
  question?: string
): ValidationResult => {
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

  // Handle number comparison questions (e.g., "less than five")
  if (question && isNumberComparisonQuestion(question)) {
    const comparisonText = question.toLowerCase();
    const comparisonNumber = comparisonText.includes('less than') ? 
      wordToNumber(comparisonText.split('less than')[1].trim()) :
      comparisonText.includes('greater than') ? 
        wordToNumber(comparisonText.split('greater than')[1].trim()) : 
        null;
    
    if (comparisonNumber !== null) {
      const userNumbers = userAnswers.map(ans => wordToNumber(ans)).filter((n): n is number => n !== null);
      
      // Generate all valid answers for the comparison
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
          : `Incorrect. The correct answers were: ${allPossibleAnswers.join(', ')}`
      };
    }
  }
  
  // Normalize all answers for comparison
  const normalizedUserAnswers = userAnswers.map(normalizeText);
  const normalizedCorrectAnswers = correctAnswers.map(normalizeText);
  
  // Check if "All of the above" is among the correct answers
  const hasAllOfTheAbove = correctAnswers.some(answer => answer && isAllOfTheAbove(answer));
  
  let isCorrect = false;
  
  if (hasAllOfTheAbove) {
    // Case 1: User selected "All of the above"
    const userSelectedAllOfTheAbove = normalizedUserAnswers.some(answer => answer && isAllOfTheAbove(answer));
    
    // Case 2: User selected all individual options (excluding "All of the above")
    const individualOptions = correctAnswers.filter(answer => answer && !isAllOfTheAbove(answer));
    const selectedAllIndividualOptions = 
      normalizedUserAnswers.length === individualOptions.length &&
      individualOptions.every(option => 
        option && normalizedUserAnswers.includes(normalizeText(option))
      );
    
    isCorrect = userSelectedAllOfTheAbove || selectedAllIndividualOptions;
  } else {
    // Regular multiple answer validation
    isCorrect = normalizedUserAnswers.length === normalizedCorrectAnswers.length &&
                normalizedUserAnswers.every(answer => 
                  answer && normalizedCorrectAnswers.includes(answer)
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
  if (!userAnswer || !correctAnswer) {
    return {
      isCorrect: false,
      explanation: 'Missing answer or correct answer'
    };
  }

  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);
  
  let isCorrect = false;
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
    isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
  }

  return {
    isCorrect,
    explanation: isCorrect 
      ? 'Correct!' 
      : `Incorrect. The expected answer was: ${correctAnswer}`
  };
};

// Validate dropdown questions (same logic as multiple choice)
export const validateDropdown = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): ValidationResult => {
  return validateMultipleChoice(userAnswer, correctAnswer, question);
};
