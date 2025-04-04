
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

    // Generate initial lesson content
    try {
      if (isPlacementTest) {
        console.log("Generating placement test...");
        const placementTestPrompt = LessonPromptTemplates.createLessonPrompt(subject, grade, "current");
        lessonContent = await generateWithAI(placementTestPrompt, aiProvider);
      } else {
        console.log("Generating regular lesson...");
        const lessonPrompt = LessonPromptTemplates.createLessonPrompt(subject, grade, "current");
        lessonContent = await generateWithAI(lessonPrompt, aiProvider);
      }
    } catch (error) {
      console.error("Error generating lesson content:", error);
      throw new Error(`Failed to generate lesson: ${error.message}`);
    }
    
    if (!lessonContent || lessonContent.trim() === '') {
      throw new Error("Empty response received from AI provider");
    }
    
    console.log("Generated content length:", lessonContent.length);
    console.log("Content preview:", lessonContent.substring(0, 200) + "...");

    // Generate and validate questions
    let questionsText = "";
    let attemptsLeft = 3;
    let questions = [];

    while (attemptsLeft > 0) {
      try {
        const questionsPrompt = LessonPromptTemplates.createQuestionsPrompt(lessonContent, grade);
        questionsText = await generateWithAI(questionsPrompt, aiProvider);
        
        if (!questionsText || questionsText.trim() === '') {
          throw new Error("Empty questions response received from AI provider");
        }
        
        console.log("Generated questions text length:", questionsText.length);
        console.log("Questions preview:", questionsText.substring(0, 200) + "...");
        
        // Validate and parse the questions
        questions = await validateQuestions(questionsText, aiProvider);
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          throw new Error("Invalid or empty questions array after validation");
        }
        
        break; // Success! Exit the loop
        
      } catch (error) {
        attemptsLeft--;
        console.error(`Attempt ${3 - attemptsLeft}: Error generating questions:`, error);
        
        if (attemptsLeft === 0) {
          // If we've exhausted all attempts, return a lesson with default questions
          console.warn("Failed to generate questions after 3 attempts, using default questions");
          questions = [
            {
              "question": "What is the main topic of this lesson?",
              "type": "multiple-choice",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "answer": "Option 1"
            },
            {
              "question": "Select all concepts covered in this lesson.",
              "type": "multiple-answer",
              "options": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
              "correctAnswers": ["Concept 1", "Concept 2"]
            },
            {
              "question": "The content in this lesson is accurate.",
              "type": "true-false",
              "answer": "true"
            },
            {
              "question": "What is the best description of this subject?",
              "type": "dropdown",
              "options": ["Description 1", "Description 2", "Description 3", "Description 4"],
              "answer": "Description 1"
            },
            {
              "question": "Which example best illustrates the main concept?",
              "type": "multiple-choice",
              "options": ["Example 1", "Example 2", "Example 3", "Example 4"],
              "answer": "Example 1"
            }
          ];
        } else {
          // Wait a bit before trying again
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Extract title from the first line of content
    let title = "Lesson on " + subject;
    const firstLine = lessonContent.trim().split('\n')[0];
    if (firstLine && firstLine.trim().length > 0) {
      title = firstLine.replace(/^#+ /, '');
    }
    
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
