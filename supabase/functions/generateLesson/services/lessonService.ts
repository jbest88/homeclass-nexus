import { generateWithAI } from "./aiService.ts"; // generateWithAI now uses the hardcoded model
import { validateQuestions } from "../validators/questionValidator.ts"; // Assuming path is correct
import * as LessonPromptTemplates from "../prompts/index.ts"; // Assuming path is correct

export interface LessonContent {
  title: string;
  content: string;
  questions: any[]; // Consider defining a stricter Question type
}

// Removed aiProvider parameter from signature
export async function generateLesson(
  subject: string,
  grade: string,
  isRetry: boolean = false, // Note: isRetry isn't currently used to modify prompts/logic here
  isPlacementTest: boolean = false
): Promise<LessonContent> {
  // Log generation details (model is now hardcoded in aiService)
  console.log(`Starting generation for: {
  type: "${isPlacementTest ? 'PlacementTest' : 'Lesson'}",
  subject: "${subject}",
  grade: "${grade}"
}`);

  try {
    let lessonContent: string;

    // --- Generate initial lesson content ---
    try {
      // Determine the correct prompt template (assuming "current" is desired)
      const promptTemplateType = "current";
      const prompt = LessonPromptTemplates.createLessonPrompt(subject, grade, promptTemplateType);

      const contentType = isPlacementTest ? 'placement test' : 'regular lesson';
      console.log(`Generating ${contentType} (using hardcoded model gemini-2.5-pro-exp-03-25)...`);

      // Call generateWithAI without the model name argument
      lessonContent = await generateWithAI(prompt);

    } catch (error) {
      console.error("Error generating initial lesson/test content:", error);
      throw new Error(`Failed to generate initial content: ${error.message}`);
    }

    if (!lessonContent || lessonContent.trim() === '') {
      throw new Error("Empty response received from AI provider for initial content");
    }

    console.log("Generated content length:", lessonContent.length);
    console.log("Content preview:", lessonContent.substring(0, 200) + "...");

    // --- Generate and validate questions ---
    let questionsText = "";
    let attemptsLeft = 3;
    let questions: any[] = []; // Use specific type if available

    while (attemptsLeft > 0) {
      const questionAttempt = 4 - attemptsLeft; // 1, 2, 3
      try {
        console.log(`Attempt ${questionAttempt} to generate questions (using hardcoded model gemini-2.5-pro-exp-03-25)...`);
        const questionsPrompt = LessonPromptTemplates.createQuestionsPrompt(lessonContent, grade);

        // Call generateWithAI without the model name argument
        questionsText = await generateWithAI(questionsPrompt);

        if (!questionsText || questionsText.trim() === '') {
          throw new Error("Empty questions response received from AI provider");
        }

        console.log("Generated questions text length:", questionsText.length);
        console.log("Questions preview:", questionsText.substring(0, 200) + "...");

        // Validate and parse the questions
        // Assuming validateQuestions handles JSON parsing and structural validation
        questions = await validateQuestions(questionsText);

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
           console.error("Invalid or empty questions array after validation. Raw text received:", questionsText);
           throw new Error("Invalid or empty questions array after validation");
        }

        console.log(`Successfully generated and validated ${questions.length} questions on attempt ${questionAttempt}.`);
        break; // Success! Exit the loop

      } catch (error) {
        attemptsLeft--;
        console.error(`Attempt ${questionAttempt}: Error generating/validating questions:`, error);

        if (attemptsLeft === 0) {
          console.warn("Failed to generate valid questions after 3 attempts, using default fallback questions.");
          // Use the provided fallback questions
          questions = [
             { "question": "What is the main topic of this lesson?", "type": "multiple-choice", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "answer": "Option 1" },
             { "question": "Select all concepts covered in this lesson.", "type": "multiple-answer", "options": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"], "correctAnswers": ["Concept 1", "Concept 2"] },
             { "question": "The content in this lesson is accurate.", "type": "true-false", "answer": "true" },
             { "question": "What is the best description of this subject?", "type": "dropdown", "options": ["Description 1", "Description 2", "Description 3", "Description 4"], "answer": "Description 1" },
             { "question": "Which example best illustrates the main concept?", "type": "multiple-choice", "options": ["Example 1", "Example 2", "Example 3", "Example 4"], "answer": "Example 1" }
          ];
          break; // Exit loop after applying fallback
        } else {
          console.log(`Waiting 2 seconds before retry #${questionAttempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retrying
        }
      }
    } // End while loop for questions

    // --- Extract title ---
    let title = "Lesson on " + subject; // Default title
    const contentLines = lessonContent.trim().split('\n');
    if (contentLines.length > 0) {
        const firstLine = contentLines[0].trim();
        if (firstLine.startsWith('#')) { // Basic check for markdown header
             title = firstLine.replace(/^#+\s*/, ''); // Remove leading '#' and spaces
        } else if (firstLine.length > 0 && firstLine.length < 100) { // Use short first lines
            title = firstLine;
        }
    }
    console.log(`Extracted Title: "${title}"`);

    // --- Return final structure ---
    return {
      title,
      content: lessonContent,
      questions, // Contains either generated or fallback questions
    };

  } catch (error) {
    console.error("Error processing lesson generation in generateLesson:", error);
    // Re-throw the error to be caught by the main handler in index.ts
    throw error;
  }
}