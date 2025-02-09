
import { Question } from '../types.ts';
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.1.0";

const validateQuestionWithAI = async (question: Question): Promise<boolean> => {
  try {
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Validate this question and its answer(s). Return a JSON object with "isValid" (boolean) and "reason" (string) explaining why.
    
    Question: ${JSON.stringify(question.question)}
    Type: ${question.type}
    ${question.options ? `Options: ${JSON.stringify(question.options)}` : ''}
    ${question.type === 'multiple-answer' 
      ? `Correct Answers: ${JSON.stringify(question.correctAnswers)}`
      : `Correct Answer: ${JSON.stringify(question.answer)}`}

    Check for:
    1. Question clarity and completeness
    2. Answer correctness and presence in options
    3. For multiple choice/answer questions:
       - All options are relevant
       - Options are distinct
       - Correct answer(s) are present in options
    4. For true/false questions:
       - Statement is clear
       - Answer is definitively true or false
    5. For multiple-answer questions:
       - All correct answers must be in the options list
       - Correct answers should be a subset of options

    Return ONLY a JSON object like this:
    {
      "isValid": true/false,
      "reason": "explanation"
    }`;

    console.log('Sending validation prompt to Gemini:', prompt);
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    console.log('Raw AI response:', responseText);
    
    // Clean up the response to ensure valid JSON
    const cleanedResponse = responseText
      .replace(/```json\n?|\n?```/g, '')  // Remove code blocks
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Remove control characters
      .trim();
    
    console.log('Cleaned AI response:', cleanedResponse);
    
    try {
      const response = JSON.parse(cleanedResponse);
      
      if (typeof response.isValid !== 'boolean') {
        console.error('Invalid response format - isValid is not boolean:', response);
        return false;
      }
      
      console.log('Parsed AI validation response:', response);
      
      if (!response.isValid) {
        console.error('Question validation failed:', response.reason);
      }
      
      return response.isValid;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Response that failed to parse:', cleanedResponse);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error validating question with AI:', error);
    throw new Error(`AI validation failed: ${error.message}`);
  }
};

export const validateQuestions = async (questions: Question[]) => {
  if (!Array.isArray(questions)) {
    throw new Error('Generated questions must be an array');
  }

  // For placement tests, expect 10 questions; for regular lessons, expect 5
  const expectedCount = questions.length === 10 ? 10 : 5;
  if (questions.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} questions, but got ${questions.length}`);
  }

  // First run basic validation
  questions.forEach((q, index) => {
    validateQuestion(q, index);
  });

  // Validate question type distribution based on total count
  if (expectedCount === 10) {
    validatePlacementTestQuestionTypes(questions);
  } else {
    validateRegularLessonQuestionTypes(questions);
  }

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
    console.error(`Invalid answer for question ${index + 1}:`, {
      answer: q.answer,
      options: q.options
    });
    throw new Error(`Question ${index + 1}'s answer must be one of the options`);
  }
};

const validateMultipleAnswer = (q: any, index: number) => {
  if (!Array.isArray(q.options) || q.options.length < 2) {
    throw new Error(`Question ${index + 1} needs at least 2 options`);
  }
  if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
    throw new Error(`Question ${index + 1} needs at least one correct answer`);
  }
  
  // Ensure all correct answers are in the options list
  const invalidAnswers = q.correctAnswers.filter((answer: string) => !q.options.includes(answer));
  if (invalidAnswers.length > 0) {
    console.error(`Invalid answers for question ${index + 1}:`, {
      correctAnswers: q.correctAnswers,
      options: q.options,
      invalidAnswers
    });
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

const validatePlacementTestQuestionTypes = (questions: Question[]) => {
  // First two should be multiple-choice (below grade level)
  if (!questions.slice(0, 2).every(q => q.type === 'multiple-choice')) {
    throw new Error('First two questions must be multiple-choice for below grade level concepts');
  }

  // Next two should be multiple-answer (at grade level)
  if (!questions.slice(2, 4).every(q => q.type === 'multiple-answer')) {
    throw new Error('Questions 3-4 must be multiple-answer for at grade level concepts');
  }

  // Next one should be true-false (at grade level)
  if (questions[4].type !== 'true-false') {
    throw new Error('Question 5 must be true-false for at grade level concepts');
  }

  // Next two should be dropdown (at grade level)
  if (!questions.slice(5, 7).every(q => q.type === 'dropdown')) {
    throw new Error('Questions 6-7 must be dropdown for at grade level concepts');
  }

  // Last three should be multiple-choice (above grade level)
  if (!questions.slice(7, 10).every(q => q.type === 'multiple-choice')) {
    throw new Error('Last three questions must be multiple-choice for above grade level concepts');
  }
};

const validateRegularLessonQuestionTypes = (questions: Question[]) => {
  const types = questions.map(q => q.type);
  const typeCount = types.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (typeCount['multiple-choice'] !== 2) {
    throw new Error('Must have exactly 2 multiple-choice questions');
  }

  const requiredSingleTypes = ['multiple-answer', 'true-false', 'dropdown'];
  const missingTypes = requiredSingleTypes.filter(type => typeCount[type] !== 1);
  
  if (missingTypes.length > 0) {
    throw new Error(`Missing required question types: ${missingTypes.join(', ')}`);
  }
};

