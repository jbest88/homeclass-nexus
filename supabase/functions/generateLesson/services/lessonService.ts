import { generateWithGemini } from '../utils.ts';
import { createLessonPrompt, createQuestionsPrompt } from '../prompts.ts';
import { validateQuestions } from '../validators/questionValidator.ts';
import { GeneratedLesson } from '../types.ts';
import { getCurriculumPeriod } from '../utils.ts';

const extractTopics = (content: string): string[] => {
  const topics: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Look for headings that might indicate topics
    if (line.startsWith('##') || line.startsWith('###')) {
      topics.push(line.replace(/^#+\s+/, '').trim());
    }
  }
  
  return topics;
};

export const generateLesson = async (
  geminiApiKey: string,
  subject: string,
  gradeLevelText: string,
  difficultyLevel: string,
  proficiencyLevel: number,
  isRetry: boolean
): Promise<GeneratedLesson> => {
  console.log('Generating lesson content with difficulty:', difficultyLevel);
  
  const currentDate = new Date().toISOString();
  const curriculumPeriod = getCurriculumPeriod(currentDate);
  
  const lessonPrompt = createLessonPrompt(
    subject, 
    gradeLevelText, 
    difficultyLevel, 
    isRetry ? Math.max(1, proficiencyLevel - 2) : proficiencyLevel,
    curriculumPeriod
  );
  const lessonContent = await generateWithGemini(geminiApiKey, lessonPrompt);

  // Extract topics from the lesson content
  const topics = extractTopics(lessonContent);
  console.log('Extracted topics:', topics);

  // Search for relevant YouTube videos
  const videoSearchResponse = await fetch(
    'http://localhost:54321/functions/v1/searchYouTubeVideos',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ topics }),
    }
  );

  const videos = await videoSearchResponse.json();
  console.log('Found videos:', videos);

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
    videos,
  };
};