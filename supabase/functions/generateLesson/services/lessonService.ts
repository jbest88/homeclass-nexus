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

  let validQuestions = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (!validQuestions && attempts < maxAttempts) {
    attempts++;
    console.log(`Generating questions attempt ${attempts}/${maxAttempts}`);
    
    try {
      const questionsPrompt = createQuestionsPrompt(
        lessonContent, 
        gradeLevelText, 
        difficultyLevel, 
        isRetry ? Math.max(1, proficiencyLevel - 2) : proficiencyLevel
      );
      const questionsText = await generateWithGemini(geminiApiKey, questionsPrompt);

      console.log('Raw questions text:', questionsText);
      
      const cleanedQuestionsText = questionsText
        .replace(/```json\n|\n```/g, '')
        .replace(/^[\s\n]*\[/, '[')
        .replace(/\][\s\n]*$/, ']')
        .trim();
      
      console.log('Cleaned questions text:', cleanedQuestionsText);
      
      try {
        const questions = JSON.parse(cleanedQuestionsText);
        await validateQuestions(questions);
        validQuestions = questions;
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

  // Search for relevant YouTube videos using the YouTube API directly
  const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key not configured");
  }

  let videos = [];
  try {
    // Process topics in groups of three
    for (let i = 0; i < topics.length; i += 3) {
      const topicGroup = topics.slice(i, i + 3);
      const searchQuery = topicGroup.join(" ");
      
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.append("part", "snippet");
      searchUrl.searchParams.append("q", `${searchQuery} educational tutorial`);
      searchUrl.searchParams.append("type", "video");
      searchUrl.searchParams.append("maxResults", "1");
      searchUrl.searchParams.append("videoEmbeddable", "true");
      searchUrl.searchParams.append("key", YOUTUBE_API_KEY);

      const response = await fetch(searchUrl.toString());
      const data = await response.json();

      if (data.items?.[0]) {
        videos.push({
          videoId: data.items[0].id.videoId,
          title: data.items[0].snippet.title,
          description: data.items[0].snippet.description,
          topics: topicGroup,
        });
      }
    }
    console.log('Found videos:', videos);
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    // Continue without videos if there's an error
    videos = [];
  }

  const title = lessonContent.split('\n')[0].replace('#', '').trim();
  const content = lessonContent.split('\n').slice(1).join('\n').trim();

  console.log('Successfully generated lesson');

  return {
    title,
    content,
    questions: validQuestions,
    videos: videos || [],
  };
};
