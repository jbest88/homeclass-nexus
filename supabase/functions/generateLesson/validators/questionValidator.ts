import { Question } from '../types.ts';
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.1.0";

const validateQuestionWithAI = async (question: Question): Promise<boolean> => {
  try {
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Validate this question and its answer(s). Return a JSON object with "isValid" (boolean) and "reason" (string) explaining why.
    
    Question: "${question.question}"
    Type: ${question.type}
    ${question.options ? `Options: ${JSON.stringify(question.options)}` : ''}
    ${question.type === 'multiple-answer' 
      ? `Correct Answers: ${JSON.stringify(question.correctAnswers)}`
      : `Correct Answer: ${question.answer}`}

    Check for:
    1. Question clarity and completeness
    2. Answer correctness (must be unambiguously correct)
    3. For multiple choice/answer questions:
       - All options are relevant to the question
       - Options are distinct and unambiguous
       - Correct answer(s) are present in the options
    4. For true/false questions:
       - Statement is clear and unambiguous
       - Answer is definitively true or false
    5. For text questions:
       - Question has a specific, clear answer
       - Answer is appropriate for the grade level

    Return ONLY a JSON object like this:
    {
      "isValid": true/false,
      "reason": "explanation of validity or issues found"
    }`;

    console.log('Sending validation prompt to Gemini:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    
    console.log('AI validation response:', response);
    
    if (!response.isValid) {
      console.error('Question validation failed:', response.reason);
    }
    
    return response.isValid;
  } catch (error) {
    console.error('Error validating question with AI:', error);
    throw new Error(`AI validation failed: ${error.message}`);
  }
};

export const validateQuestions = async (questions: Question[]) => {
  if (!Array.isArray(questions)) {
    throw new Error('Generated questions must be an array');
  }

  if (questions.length !== 5) {
    throw new Error(`Expected 5 questions, but got ${questions.length}`);
  }

  // First run basic validation
  questions.forEach((q, index) => {
    validateQuestion(q, index);
  });

  validateQuestionTypes(questions);

  // Then run AI validation for each question
  console.log('Running AI validation on questions...');
  const validationResults = await Promise.all(
    questions.map(async (q, index) => {
      const isValid = await validateQuestionWithAI(q);
      return { index, isValid };
    })
  );

  const invalidQuestions = validationResults.filter(result => !result.isValid);
  if (invalidQuestions.length > 0) {
    throw new Error(`Questions at indices ${invalidQuestions.map(q => q.index).join(', ')} failed AI validation`);
  }
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