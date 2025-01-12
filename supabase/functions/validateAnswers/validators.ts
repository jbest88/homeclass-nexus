import { ValidationResult } from './types.ts';
import { 
  normalizeText, 
  isAllOfTheAbove, 
  evaluateExponentExpression, 
  isMathQuestion,
  wordToNumber,
  isNumberComparisonQuestion,
  calculateDiscriminant,
  isMathematicalQuestion
} from './utils.ts';

const validateMathematicalAnswer = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): boolean => {
  // Handle discriminant questions
  if (question.toLowerCase().includes('discriminant')) {
    const equation = question.match(/\$.*\$/)?.[0].replace(/\$/g, '') || '';
    const calculatedDiscriminant = calculateDiscriminant(equation);
    const userValue = parseInt(userAnswer);
    return calculatedDiscriminant === userValue;
  }
  
  // Handle other mathematical validations...
  return false;
};

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

  if (isMathematicalQuestion(question)) {
    isCorrect = validateMathematicalAnswer(normalizedUserAnswer, normalizedCorrectAnswer, question);
    if (question.toLowerCase().includes('discriminant')) {
      const equation = question.match(/\$.*\$/)?.[0].replace(/\$/g, '') || '';
      const calculatedDiscriminant = calculateDiscriminant(equation);
      explanation = isCorrect 
        ? `Correct! The discriminant of ${equation} is ${calculatedDiscriminant}. Here's how we calculate it:\n` +
          `1. For a quadratic equation ax² + bx + c, the discriminant is b² - 4ac\n` +
          `2. In this equation, a = 2, b = -4, c = 3\n` +
          `3. Discriminant = (-4)² - 4(2)(3)\n` +
          `4. = 16 - 24\n` +
          `5. = -8`
        : `Incorrect. The discriminant of ${equation} is ${calculatedDiscriminant}. Here's how we calculate it:\n` +
          `1. For a quadratic equation ax² + bx + c, the discriminant is b² - 4ac\n` +
          `2. In this equation, a = 2, b = -4, c = 3\n` +
          `3. Discriminant = (-4)² - 4(2)(3)\n` +
          `4. = 16 - 24\n` +
          `5. = -8`;
    }
  } else if (isMathQuestion(question)) {
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
    explanation: explanation || (isCorrect 
      ? 'Correct!' 
      : `Incorrect. The correct answer is: ${correctAnswer}`)
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

  if (question && isNumberComparisonQuestion(question)) {
    const comparisonText = question.toLowerCase();
    const comparisonNumber = comparisonText.includes('less than') ? 
      wordToNumber(comparisonText.split('less than')[1].trim()) :
      comparisonText.includes('greater than') ? 
        wordToNumber(comparisonText.split('greater than')[1].trim()) : 
        null;
    
    if (comparisonNumber !== null) {
      const userNumbers = userAnswers.map(ans => wordToNumber(ans)).filter((n): n is number => n !== null);
      
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
  
  const normalizedUserAnswers = userAnswers.map(normalizeText);
  const normalizedCorrectAnswers = correctAnswers.map(normalizeText);
  
  const hasAllOfTheAbove = correctAnswers.some(answer => answer && isAllOfTheAbove(answer));
  
  let isCorrect = false;
  
  if (hasAllOfTheAbove) {
    const userSelectedAllOfTheAbove = normalizedUserAnswers.some(answer => answer && isAllOfTheAbove(answer));
    
    const individualOptions = correctAnswers.filter(answer => answer && !isAllOfTheAbove(answer));
    const selectedAllIndividualOptions = 
      normalizedUserAnswers.length === individualOptions.length &&
      individualOptions.every(option => 
        option && normalizedUserAnswers.includes(normalizeText(option))
      );
    
    isCorrect = userSelectedAllOfTheAbove || selectedAllIndividualOptions;
  } else {
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

export const validateDropdown = (
  userAnswer: string,
  correctAnswer: string,
  question: string
): ValidationResult => {
  return validateMultipleChoice(userAnswer, correctAnswer, question);
};