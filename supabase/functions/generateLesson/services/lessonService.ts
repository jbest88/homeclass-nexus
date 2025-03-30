
import { generateWithAI, AIProvider } from "./aiService.ts";
import { validateQuestions } from "../validators/questionValidator.ts";
import * as LessonPromptTemplates from "../prompts/index.ts";

export interface LessonContent {
  title: string;
  content: string;
  questions: any[];
}

export async function generateLesson(
  subject: string,
  grade: string,
  isRetry: boolean = false,
  aiProvider: AIProvider = 'gemini-pro',
  isPlacementTest: boolean = false,
  apiKey?: string
): Promise<LessonContent> {
  console.log(`Starting generation for: {
  type: "${isPlacementTest ? 'PlacementTest' : 'Lesson'}",
  subject: "${subject}",
  grade: "${grade}",
  provider: "${aiProvider}"
}`);

  try {
    let lessonContent: string;

    if (isPlacementTest) {
      console.log("Generating placement test...");
      const placementTestPrompt = LessonPromptTemplates.getPlacementTestPrompt(subject, grade);
      lessonContent = await generateWithAI(placementTestPrompt, aiProvider, apiKey);
    } else {
      console.log("Generating regular lesson...");
      const lessonPrompt = LessonPromptTemplates.getLessonPrompt(subject, grade, isRetry);
      lessonContent = await generateWithAI(lessonPrompt, aiProvider, apiKey);
    }
    
    console.log("Generated content length:", lessonContent.length);

    // We try a maximum of 3 times to generate valid questions
    let questionsText = "";
    let attemptsLeft = 3;
    let questions = [];

    while (attemptsLeft > 0) {
      try {
        const questionsPrompt = LessonPromptTemplates.getQuestionsPrompt(lessonContent);
        questionsText = await generateWithAI(questionsPrompt, aiProvider, apiKey);
        
        // Validate and parse the questions
        questions = await validateQuestions(questionsText, apiProvider, apiKey);
        break; // Success! Exit the loop
        
      } catch (error) {
        attemptsLeft--;
        console.error(`Attempt ${3 - attemptsLeft}: Error generating questions:`, error);
        
        if (attemptsLeft === 0) {
          throw new Error(`Failed to generate questions after 3 attempts: ${error.message}`);
        }
        
        // Wait a bit before trying again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Extract title from the first line of content
    const title = lessonContent.trim().split('\n')[0].replace(/^#+ /, '');
    
    return {
      title,
      content: lessonContent,
      questions,
    };
    
  } catch (error) {
    console.error("Error in generateLesson:", error);
    throw error;
  }
}
