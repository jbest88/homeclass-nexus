import { Question } from '../types';

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

  const validTypes = ['multiple-choice', 'multiple-answer', 'true-false', 'dropdown', 'text'];
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
    case 'text':
      validateText(q, index);
      break;
  }
};

const validateMultipleChoice = (q: any, index: number) => {
  if (!Array.isArray(q.options) || q.options.length < 2) {
    throw new Error(`Question ${index + 1} needs at least 2 options`);
  }
  if (!q.answer || !q.options.includes(q.answer)) {
    throw new Error(`Question ${index + 1}'s answer (${q.answer}) must be one of the options: ${q.options.join(', ')}`);
  }
};

const validateMultipleAnswer = (q: any, index: number) => {
  if (!Array.isArray(q.options) || q.options.length < 2) {
    throw new Error(`Question ${index + 1} needs at least 2 options`);
  }
  if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
    throw new Error(`Question ${index + 1} needs at least one correct answer`);
  }
  const invalidAnswers = q.correctAnswers.filter((answer: string) => !q.options.includes(answer));
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

const validateText = (q: any, index: number) => {
  if (!q.answer || typeof q.answer !== 'string') {
    throw new Error(`Question ${index + 1} must have a valid text answer`);
  }
};

const validateQuestionTypes = (questions: Question[]) => {
  const types = questions.map(q => q.type);
  const requiredTypes = ['multiple-choice', 'multiple-answer', 'true-false', 'dropdown'];
  const missingTypes = requiredTypes.filter(type => !types.includes(type));
  
  if (missingTypes.length > 0) {
    throw new Error(`Missing required question types: ${missingTypes.join(', ')}`);
  }
};