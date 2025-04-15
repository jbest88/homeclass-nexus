
import { generateWithAI } from "./aiService"; // Uses hardcoded model
import { createLessonOnlyPrompt } from "../prompts/index.js";

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
    // 1. Create a simpler prompt focused only on lesson content
    const lessonPrompt = createLessonOnlyPrompt(subject, grade, isPlacementTest);

    // 2. Call AI only ONCE for the lesson content
    console.log("Calling AI with lesson-only prompt (using hardcoded model)...");
    const lessonResponse = await generateWithAI(lessonPrompt);

    if (!lessonResponse || lessonResponse.trim() === '') {
      throw new Error("Empty response received from AI provider for lesson content.");
    }

    console.log("AI response received length:", lessonResponse.length);
    console.log("AI response preview:", lessonResponse.substring(0, 300) + "...");

    // 3. Parse and Validate the JSON response
    let parsedLesson: LessonContent;
    try {
      // Attempt to clean potential markdown/extraneous text before parsing
      let cleanedJsonString = lessonResponse.trim();
      const jsonMatch = cleanedJsonString.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);

      if (jsonMatch) {
        cleanedJsonString = jsonMatch[1] || jsonMatch[2] || cleanedJsonString;
        cleanedJsonString = cleanedJsonString.trim();
        console.log("Attempting to parse extracted JSON block...");
      } else {
        console.warn("Could not definitively extract JSON block from AI response, attempting parse on raw response.");
      }

      parsedLesson = JSON.parse(cleanedJsonString);

      // Basic Structure Validation
      if (!parsedLesson || typeof parsedLesson !== 'object') {
        throw new Error("Parsed response is not a valid object.");
      }
      if (!parsedLesson.title || typeof parsedLesson.title !== 'string' || parsedLesson.title.trim() === '') {
        throw new Error("Missing or invalid 'title' (string) in parsed response.");
      }
      if (!parsedLesson.content || typeof parsedLesson.content !== 'string' || parsedLesson.content.trim() === '') {
        throw new Error("Missing or invalid 'content' (string) in parsed response.");
      }

      console.log("Successfully parsed and validated lesson structure.");
      // Ensure the returned object matches the LessonContent interface
      return {
        title: parsedLesson.title,
        content: parsedLesson.content,
        questions: [] // Empty array for now
      };

    } catch (parseOrValidationError) {
      console.error("Error parsing or validating the AI's JSON response:", parseOrValidationError);
      console.error("Raw AI response that failed parsing/validation:", lessonResponse);
      throw new Error(`Failed to parse or validate the lesson structure received from AI: ${parseOrValidationError.message}`);
    }

  } catch (error) {
    console.error(`Error during lesson generation for ${subject} (${grade}):`, error);
    throw error;
  }
}
