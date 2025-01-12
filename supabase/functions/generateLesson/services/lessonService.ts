import { generateWithGemini } from '../utils.ts';
import { createLessonPrompt, createQuestionsPrompt } from '../prompts.ts';
import { validateQuestions } from '../validators/questionValidator.ts';
import { GeneratedLesson } from '../types.ts';

export const generateLesson = async (
  geminiApiKey: string,
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number,
  isRetry: boolean
): Promise<GeneratedLesson> => {
  console.log('Generating lesson content with difficulty:', difficultyLevel);
  
  const lessonPrompt = createLessonPrompt(
    subject, 
    gradeLevelText, 
    difficultyLevel, 
    isRetry ? Math.max(1, proficiencyLevel - 2) : proficiencyLevel,
  );
  const lessonContent = await generateWithGemini(geminiApiKey, lessonPrompt);

  console.log('Generating questions');
  const questionsPrompt = createQuestionsPrompt(
    lessonContent, 
    gradeLevelText, 
    difficultyLevel, 
    isRetry ? Math.max(1, proficiencyLevel - 2) : proficiencyLevel
  );
  const questionsText = await generateWithGemini(geminiApiKey, questionsPrompt);

  let questions;
  try {
    console.log('Raw questions text:', questionsText);
    
    const cleanedQuestionsText = questionsText
      .replace(/```json\n|\n```/g, '')
      .replace(/^[\s\n]*\[/, '[')
      .replace(/\][\s\n]*$/, ']')
      .trim();
    
    console.log('Cleaned questions text:', cleanedQuestionsText);
    
    try {
      questions = JSON.parse(cleanedQuestionsText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error(`Failed to parse questions JSON: ${parseError.message}`);
    }

    validateQuestions(questions);

  } catch (error) {
    console.error('Error validating questions:', error);
    console.log('Questions array:', questions);
    throw new Error(`Question validation failed: ${error.message}`);
  }

  const title = lessonContent.split('\n')[0].replace('#', '').trim();
  const content = lessonContent.split('\n').slice(1).join('\n').trim();

  console.log('Successfully generated lesson');

  return {
    title,
    content,
    questions,
  };
};