import { Question } from '../types.ts';

export const validateQuestions = (questions: Question[]) => {
  if (!Array.isArray(questions)) {
    throw new Error('Generated questions must be an array');
  }

  if (questions.length !== 5) {
    throw new Error(`Expected 5 questions, but got ${questions.length}`);
  }

  questions.forEach((q, index) => {
    validateQuestion(q, index);
  });

  validateQuestionTypes(questions);
};

const validateQuestion = (q: any, index: number) => {
  if (!q || typeof q !== 'object') {
    throw new Error(`Question ${index + 1} is not a valid object`);
  }

  if (!q.question || typeof q.question !== 'string') {
    throw new Error(`Question ${index + 1} is missing a valid question text`);
  }

  if (!q.type || typeof q.type !== 'string') {
    throw new Error(`Question ${index + 1} is missing a valid type`);
  }

  const validTypes = ['multiple-choice', 'multiple-answer', 'true-false', 'dropdown'];
  if (!validTypes.includes(q.type)) {
    throw new Error(`Question ${index + 1} has an invalid type: ${q.type}`);
  }

  validateQuestionType(q, index);
};

const validateQuestionType = (q: any, index: number) => {
  switch (q.type) {
    case 'multiple-choice':
    case 'dropdown':
      validateMultipleChoice(q, index);
      break;
    case 'multiple-answer':
      validateMultipleAnswer(q, index);
      break;
    case 'true-false':
      validateTrueFalse(q, index);
      break;
  }
};

const validateMultipleChoice = (q: any, index: number) => {
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error(`Question ${index + 1} needs exactly 4 options`);
  }

  // Ensure all options are strings and unique
  const uniqueOptions = new Set(q.options.map(String));
  if (uniqueOptions.size !== q.options.length) {
    throw new Error(`Question ${index + 1} has duplicate options`);
  }

  // Convert answer to string for comparison
  const stringAnswer = String(q.answer);
  if (!q.answer || !q.options.map(String).includes(stringAnswer)) {
    throw new Error(`Question ${index + 1}'s answer (${q.answer}) must be one of the options: ${q.options.join(', ')}`);
  }
};

const validateMultipleAnswer = (q: any, index: number) => {
  if (!Array.isArray(q.options) || q.options.length < 2) {
    throw new Error(`Question ${index + 1} needs at least 2 options`);
  }

  // Ensure all options are strings and unique
  const uniqueOptions = new Set(q.options.map(String));
  if (uniqueOptions.size !== q.options.length) {
    throw new Error(`Question ${index + 1} has duplicate options`);
  }

  if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
    throw new Error(`Question ${index + 1} needs at least one correct answer`);
  }

  // Convert all answers to strings for comparison
  const stringAnswers = q.correctAnswers.map(String);
  const stringOptions = q.options.map(String);
  const invalidAnswers = stringAnswers.filter(answer => !stringOptions.includes(answer));

  if (invalidAnswers.length > 0) {
    throw new Error(`Question ${index + 1}'s correct answers (${invalidAnswers.join(', ')}) must all be in the options: ${q.options.join(', ')}`);
  }
};

const validateTrueFalse = (q: any, index: number) => {
  if (typeof q.answer === 'boolean') {
    q.answer = q.answer.toString();
  }
  q.answer = q.answer.toLowerCase();
  if (q.answer !== 'true' && q.answer !== 'false') {
    throw new Error(`Question ${index + 1}'s answer must be 'true' or 'false', got: ${q.answer}`);
  }
};

const validateQuestionTypes = (questions: Question[]) => {
  const types = questions.map(q => q.type);
  const typeCount = types.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check for exactly 2 multiple-choice questions
  if (typeCount['multiple-choice'] !== 2) {
    throw new Error('Must have exactly 2 multiple-choice questions');
  }

  // Check for exactly 1 of each other type
  const requiredSingleTypes = ['multiple-answer', 'true-false', 'dropdown'];
  const missingTypes = requiredSingleTypes.filter(type => typeCount[type] !== 1);
  
  if (missingTypes.length > 0) {
    throw new Error(`Missing required question types: ${missingTypes.join(', ')}`);
  }
};