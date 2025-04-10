import { generateWithAI } from "./aiService"; // Uses hardcoded model
// Import the new prompt creator function (adjust path if needed)
import { createCombinedLessonPrompt } from "../prompts/index.js";
// We will do validation directly here, so questionValidator import might be removed

export interface LessonContent {
  title: string;
  content: string;
  questions: any[]; // Consider a stricter Question type definition
}

// Updated function signature (aiProvider removed previously)
export async function generateLesson(
  subject: string,
  grade: string,
  isRetry: boolean = false, // Still not used, consider removing if not needed
  isPlacementTest: boolean = false
): Promise<LessonContent> {

  const lessonTypeLog = isPlacementTest ? "PlacementTest" : "Lesson";
  console.log(`Starting single-call generation for: {
  type: "${lessonTypeLog}",
  subject: "${subject}",
  grade: "${grade}"
}`);

  try {
    // 1. Create the combined prompt
    const combinedPrompt = createCombinedLessonPrompt(subject, grade, isPlacementTest);

    // 2. Call AI only ONCE
    console.log("Calling AI with combined prompt (using hardcoded model)...");
    const lessonJsonString = await generateWithAI(combinedPrompt);

    if (!lessonJsonString || lessonJsonString.trim() === '') {
      throw new Error("Empty response received from AI provider for combined lesson content.");
    }

    console.log("AI response received length:", lessonJsonString.length);
    console.log("AI response preview:", lessonJsonString.substring(0, 300) + "...");

    // 3. Parse and Validate the single JSON response
    let parsedLesson: LessonContent;
    try {
      // Attempt to clean potential markdown/extraneous text before parsing
      let cleanedJsonString = lessonJsonString.trim();
      const jsonMatch = cleanedJsonString.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/); // Look for ```json ... ``` or starting {

       if (jsonMatch) {
           cleanedJsonString = jsonMatch[1] || jsonMatch[2] || cleanedJsonString; // Extract content
           cleanedJsonString = cleanedJsonString.trim();
           console.log("Attempting to parse extracted JSON block...");
       } else {
           console.warn("Could not definitively extract JSON block from AI response, attempting parse on raw response.");
       }

      parsedLesson = JSON.parse(cleanedJsonString);

      // --- Basic Structure Validation ---
      if (!parsedLesson || typeof parsedLesson !== 'object') {
        throw new Error("Parsed response is not a valid object.");
      }
      if (!parsedLesson.title || typeof parsedLesson.title !== 'string' || parsedLesson.title.trim() === '') {
        throw new Error("Missing or invalid 'title' (string) in parsed response.");
      }
      if (!parsedLesson.content || typeof parsedLesson.content !== 'string' || parsedLesson.content.trim() === '') {
         throw new Error("Missing or invalid 'content' (string) in parsed response.");
      }
      if (!parsedLesson.questions || !Array.isArray(parsedLesson.questions)) {
        throw new Error("Missing or invalid 'questions' (array) in parsed response.");
      }
      // Optionally add length check for questions array if needed parsedLesson.questions.length !== 5 etc.


      // --- Detailed Per-Question Validation (Optional but recommended) ---
      for (let i = 0; i < parsedLesson.questions.length; i++) {
          const q = parsedLesson.questions[i];
          if (!q || typeof q !== 'object') throw new Error(`Question at index ${i} is not a valid object.`);
          if (!q.question || typeof q.question !== 'string') throw new Error(`Invalid/missing 'question' (string) at index ${i}`);
          if (!q.type || typeof q.type !== 'string') throw new Error(`Invalid/missing 'type' (string) at index ${i}`);

           // Add field checks based on type (similar to previous validateQuestions logic)
          if (['multiple-choice', 'multiple-answer', 'dropdown'].includes(q.type)) {
              if (!q.options || !Array.isArray(q.options) || q.options.length < 2) { // Need at least 2 options usually
                   throw new Error(`Invalid/missing 'options' (array, min 2 elements) at index ${i} for type ${q.type}`);
              }
          }
           if (['multiple-choice', 'true-false', 'dropdown'].includes(q.type)) {
               // Allow boolean for true/false answer? Check your requirements. Assuming string for now.
               if (q.answer === undefined || q.answer === null || typeof q.answer !== 'string') {
                   throw new Error(`Invalid or missing 'answer' (string) at index ${i} for type ${q.type}`);
               }
               if (q.hasOwnProperty('correctAnswers')) { // Should NOT have correctAnswers
                    throw new Error(`Field 'correctAnswers' should not be present for type ${q.type} at index ${i}`);
               }
           } else if (q.type === 'multiple-answer') {
               if (!q.correctAnswers || !Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) { // Allow empty array? Usually need at least one correct.
                   throw new Error(`Invalid or missing 'correctAnswers' (array, min 1 element) at index ${i} for type ${q.type}`);
               }
                if (q.hasOwnProperty('answer')) { // Should NOT have answer
                    throw new Error(`Field 'answer' should not be present for type ${q.type} at index ${i}`);
               }
           }
      }
      // --- End Validation ---

      console.log("Successfully parsed and validated combined lesson structure.");
      // Ensure the returned object matches the LessonContent interface
      return {
          title: parsedLesson.title,
          content: parsedLesson.content,
          questions: parsedLesson.questions
      };

    } catch (parseOrValidationError) {
      console.error("Error parsing or validating the AI's JSON response:", parseOrValidationError);
      console.error("Raw AI response that failed parsing/validation:", lessonJsonString); // Log the raw string
      // Decide how to handle this - throwing error is often best for backend
      throw new Error(`Failed to parse or validate the lesson structure received from AI: ${parseOrValidationError.message}`);
      // --- Fallback Option (Instead of throwing): ---
      // console.warn("Returning default error lesson structure due to parsing/validation failure.");
      // return {
      //   title: `Error Generating Lesson: ${subject}`,
      //   content: "Could not generate valid lesson content and questions. Please try again.",
      //   questions: [],
      // };
       // --- End Fallback Option ---
    }

  } catch (error) {
    // Catch errors from the AI call itself or errors thrown from parsing/validation block
    console.error(`Error during single-call generation for ${subject} (${grade}):`, error);
    // Re-throw the error to be caught by the main handler in index.ts
    throw error; // Let index.ts handle returning the final error response (e.g., 500 or 503)
  }
}