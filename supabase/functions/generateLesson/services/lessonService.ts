import { generateWithAI } from "./aiService.ts"; // Added .ts extension
import { createLessonOnlyPrompt } from "../prompts/index.ts"; // Changed from .js to .ts extension
import { validateQuestions } from "../validators/questionValidator.ts";
import { createQuestionsPrompt } from "../prompts/index.ts";

export interface LessonContent {
  title: string;
  content: string;
  questions: []; // Empty array for now
}

export async function generateLesson(
  subject: string,
  grade: string,
  isRetry: boolean = false,
  isPlacementTest: boolean = false
): Promise<LessonContent> {

  const lessonTypeLog = isPlacementTest ? "PlacementTest" : "Lesson";
  console.log(`Starting simplified lesson generation for: {
  type: "${lessonTypeLog}",
  subject: "${subject}",
  grade: "${grade}"
}`);

  try {
    // 1. Generate lesson content first
    const lessonPrompt = createLessonOnlyPrompt(subject, grade, isPlacementTest);
    console.log("Prompt length:", lessonPrompt.length);

    const startTime = Date.now();
    console.log("Calling AI for lesson content...");
    const lessonResponse = await generateWithAI(lessonPrompt);
    console.log(`Lesson AI response time: ${Date.now() - startTime}ms`);

    if (!lessonResponse || lessonResponse.trim() === '') {
      throw new Error("Empty response received from AI provider for lesson content.");
    }

    // Parse lesson content
    let parsedLesson: Partial<LessonContent>;
    try {
      let cleanedJsonString = lessonResponse.trim();
      const jsonMatch = cleanedJsonString.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        cleanedJsonString = jsonMatch[1] || jsonMatch[2] || cleanedJsonString;
        cleanedJsonString = cleanedJsonString.trim();
      }

      parsedLesson = JSON.parse(cleanedJsonString);
      
      if (!parsedLesson?.title || !parsedLesson?.content) {
        throw new Error("Invalid lesson structure in parsed response");
      }
    } catch (parseError) {
      console.error("Error parsing lesson JSON:", parseError);
      throw new Error(`Failed to parse lesson response: ${parseError.message}`);
    }

    // 2. Generate questions based on the lesson content
    console.log("Generating questions based on lesson content...");
    const questionsPrompt = createQuestionsPrompt(parsedLesson.content, grade);
    const questionsStartTime = Date.now();
    const questionsResponse = await generateWithAI(questionsPrompt);
    console.log(`Questions AI response time: ${Date.now() - questionsStartTime}ms`);

    // 3. Validate and parse questions
    console.log("Validating questions...");
    let questions = [];
    try {
      questions = await validateQuestions(questionsResponse);
      console.log("Questions validated successfully");
    } catch (error) {
      console.error("Error validating questions:", error);
      // If question validation fails, return lesson with empty questions array
      console.log("Returning lesson without questions due to validation error");
      questions = [];
    }

    // 4. Return complete lesson with content and questions
    return {
      title: parsedLesson.title,
      content: parsedLesson.content,
      questions: questions
    };

  } catch (error) {
    console.error(`Error during lesson generation for ${subject} (${grade}):`, error);
    throw error;
  }
}
