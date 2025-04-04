
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
  aiProvider: AIProvider = 'gemini-2.5-pro-exp-03-25',
  isPlacementTest: boolean = false
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
      const placementTestPrompt = LessonPromptTemplates.createLessonPrompt(subject, grade, "current");
      lessonContent = await generateWithAI(placementTestPrompt, aiProvider);
    } else {
      console.log("Generating regular lesson...");
      const lessonPrompt = LessonPromptTemplates.createLessonPrompt(subject, grade, "current");
      lessonContent = await generateWithAI(lessonPrompt, aiProvider);
    }
    
    console.log("Generated content length:", lessonContent.length);

    // We try a maximum of 3 times to generate valid questions
    let questionsText = "";
    let attemptsLeft = 3;
    let questions = [];

    while (attemptsLeft > 0) {
      try {
        const questionsPrompt = LessonPromptTemplates.createQuestionsPrompt(lessonContent, grade);
        questionsText = await generateWithAI(questionsPrompt, aiProvider);
        
        // Validate and parse the questions
        questions = await validateQuestions(questionsText, aiProvider);
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
