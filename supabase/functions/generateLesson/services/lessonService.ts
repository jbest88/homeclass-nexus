import { generateWithAI, AIProvider } from './aiService.ts';
import { createLessonPrompt } from '../prompts/lessonPrompt.ts';
import { createPlacementTestPrompt } from '../prompts/placementTestPrompt.ts';
import { validateQuestions } from '../validators/questionValidator.ts';
import { getCurriculumPeriod } from '../utils.ts';
import { GeneratedLesson } from '../types.ts';

const extractTopics = (content: string): string[] => {
  const topics: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('##') || line.startsWith('###')) {
      const topic = line.replace(/^#+\s+/, '').trim();
      console.log('Extracted topic:', topic);
      topics.push(topic);
    }
  }
  
  return topics;
};

export const generateLesson = async (
  geminiApiKey: string,
  subject: string,
  gradeLevelText: string,
  isRetry: boolean,
  aiProvider: AIProvider = 'gemini',
  isPlacementTest: boolean = false
): Promise<GeneratedLesson> => {
  console.log('Starting generation for:', {
    type: isPlacementTest ? 'Placement Test' : 'Lesson',
    subject,
    grade: gradeLevelText,
    provider: aiProvider
  });
  
  let content = '';
  let questions = [];
  
  if (isPlacementTest) {
    console.log('Generating placement test questions...');
    const prompt = createPlacementTestPrompt(subject, gradeLevelText);
    const questionsText = await generateWithAI(prompt, aiProvider);
    
    console.log('Raw questions text:', questionsText);
    
    const cleanedQuestionsText = questionsText
      .replace(/```json\n|\n```/g, '')
      .replace(/^[\s\n]*\[/, '[')
      .replace(/\][\s\n]*$/, ']')
      .trim();
    
    console.log('Cleaned questions text:', cleanedQuestionsText);
    
    try {
      questions = JSON.parse(cleanedQuestionsText);
      await validateQuestions(questions);
      console.log('Questions validated successfully');
      
      // For placement tests, we don't need additional content
      content = `# ${subject} Placement Test for ${gradeLevelText}\n\nThis placement test will assess your knowledge of ${subject} concepts relative to ${gradeLevelText} standards. The questions will range from concepts typically covered in earlier grades to more advanced topics. Answer each question to the best of your ability.`;
    } catch (error) {
      console.error('Error parsing or validating questions:', error);
      throw new Error(`Failed to generate valid placement test questions: ${error.message}`);
    }
  } else {
    console.log('Generating regular lesson...');
    const currentDate = new Date().toISOString();
    const curriculumPeriod = getCurriculumPeriod(currentDate);
    const prompt = createLessonPrompt(subject, gradeLevelText, curriculumPeriod);
    content = await generateWithAI(prompt, aiProvider);
    
    // Generate practice questions for regular lessons
    console.log('Generating practice questions...');
    let validQuestions = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!validQuestions && attempts < maxAttempts) {
      attempts++;
      console.log(`Generating questions attempt ${attempts}/${maxAttempts}`);
      
      try {
        const questionsPrompt = createQuestionsPrompt(
          content, 
          gradeLevelText
        );
        const questionsText = await generateWithAI(questionsPrompt, aiProvider);
        
        console.log('Raw questions text:', questionsText);
        
        const cleanedQuestionsText = questionsText
          .replace(/```json\n|\n```/g, '')
          .replace(/^[\s\n]*\[/, '[')
          .replace(/\][\s\n]*$/, ']')
          .trim();
        
        console.log('Cleaned questions text:', cleanedQuestionsText);
        
        try {
          const parsedQuestions = JSON.parse(cleanedQuestionsText);
          await validateQuestions(parsedQuestions);
          validQuestions = parsedQuestions;
          console.log('Questions validated successfully');
        } catch (parseError) {
          console.error(`Attempt ${attempts}: Error validating questions:`, parseError);
          if (attempts === maxAttempts) {
            throw new Error(`Failed to generate valid questions after ${maxAttempts} attempts: ${parseError.message}`);
          }
        }
      } catch (error) {
        console.error(`Attempt ${attempts}: Error generating questions:`, error);
        if (attempts === maxAttempts) {
          throw new Error(`Failed to generate questions after ${maxAttempts} attempts: ${error.message}`);
        }
      }
    }

    if (!validQuestions) {
      throw new Error('Failed to generate valid questions');
    }
    
    questions = validQuestions;
  }

  const title = isPlacementTest 
    ? `${subject} Placement Test - ${gradeLevelText}`
    : content.split('\n')[0].replace('#', '').trim();

  // For regular lessons, we want to keep all content after the title
  const finalContent = isPlacementTest 
    ? content 
    : content.split('\n').slice(1).join('\n').trim();

  console.log('Successfully generated:', {
    type: isPlacementTest ? 'Placement Test' : 'Lesson',
    title,
    contentLength: finalContent.length,
    questionsCount: questions.length
  });

  return {
    title,
    content: finalContent,
    questions,
    videos: [], // Placement tests don't need videos
  };
};