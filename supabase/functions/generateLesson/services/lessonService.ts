import { generateWithGemini } from '../utils.ts';
import { createLessonPrompt, createQuestionsPrompt } from '../prompts/index.ts';
import { validateQuestions } from '../validators/questionValidator.ts';
import { GeneratedLesson } from '../types.ts';
import { getCurriculumPeriod } from '../utils.ts';

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
  isRetry: boolean
): Promise<GeneratedLesson> => {
  console.log('Starting lesson generation for:', subject, 'Grade:', gradeLevelText);
  
  const currentDate = new Date().toISOString();
  const curriculumPeriod = getCurriculumPeriod(currentDate);
  
  const lessonPrompt = createLessonPrompt(
    subject, 
    gradeLevelText,
    curriculumPeriod
  );
  const lessonContent = await generateWithGemini(geminiApiKey, lessonPrompt);

  // Extract topics for video search
  const topics = extractTopics(lessonContent);
  console.log('All extracted topics:', topics);
  const firstTopic = topics[0];
  console.log('Selected first topic for video:', firstTopic);

  let videos = [];
  try {
    // Search for video only for the first topic
    if (firstTopic) {
      console.log('Searching YouTube video for topic:', firstTopic);
      const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
      if (!YOUTUBE_API_KEY) {
        console.error("YouTube API key not found in environment variables");
        throw new Error("YouTube API key not configured");
      }

      const searchQuery = `${subject} ${firstTopic} educational tutorial`;
      console.log('Search query:', searchQuery);

      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.append("part", "snippet");
      searchUrl.searchParams.append("q", searchQuery);
      searchUrl.searchParams.append("type", "video");
      searchUrl.searchParams.append("maxResults", "1");
      searchUrl.searchParams.append("videoEmbeddable", "true");
      searchUrl.searchParams.append("safeSearch", "strict");
      searchUrl.searchParams.append("relevanceLanguage", "en");
      searchUrl.searchParams.append("key", YOUTUBE_API_KEY);

      console.log('Making YouTube API request...');
      const response = await fetch(searchUrl.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API error response:', errorText);
        throw new Error(`YouTube API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('YouTube API response:', JSON.stringify(data, null, 2));

      if (data.error) {
        console.error('YouTube API error:', data.error);
        throw new Error(`YouTube API error: ${data.error.message}`);
      }

      if (data.items?.[0]) {
        const video = {
          videoId: data.items[0].id.videoId,
          title: data.items[0].snippet.title,
          description: data.items[0].snippet.description || "",
          topics: [firstTopic],
        };
        videos.push(video);
        console.log('Successfully found video:', video);
      } else {
        console.log('No videos found for topic:', firstTopic);
      }
    }
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    // Continue without videos if there's an error
    videos = [];
  }

  console.log('Found videos:', videos);

  let validQuestions = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (!validQuestions && attempts < maxAttempts) {
    attempts++;
    console.log(`Generating questions attempt ${attempts}/${maxAttempts}`);
    
    try {
      const questionsPrompt = createQuestionsPrompt(
        lessonContent, 
        gradeLevelText
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

  const title = lessonContent.split('\n')[0].replace('#', '').trim();
  const content = lessonContent.split('\n').slice(1).join('\n').trim();

  console.log('Successfully generated lesson with:', {
    title,
    contentLength: content.length,
    questionsCount: validQuestions.length,
    videosCount: videos.length
  });

  return {
    title,
    content,
    questions: validQuestions,
    videos: videos,
  };
};